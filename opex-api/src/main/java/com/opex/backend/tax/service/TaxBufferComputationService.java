package com.opex.backend.tax.service;

import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.tax.service.support.TaxBufferComputation;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaxBufferComputationService {

    private final BankAccountRepository bankAccountRepository;
    private final TaxEstimationService taxEstimationService;

    public TaxBufferComputation compute(String userId,
                                        int targetYear,
                                        User user,
                                        List<Transaction> yearlyTransactions,
                                        List<Tax> yearlyTaxes) {
        BigDecimal grossIncome = TaxMath.money(sumPositiveAmounts(yearlyTransactions));
        BigDecimal businessExpenses = TaxMath.money(sumAbsoluteNegativeAmounts(yearlyTransactions));
        TaxEstimate estimate = taxEstimationService.estimate(user, grossIncome, businessExpenses);
        BigDecimal taxableIncome = estimate.taxableIncome();
        BigDecimal incomeTax = TaxMath.money(resolveIncomeTax(yearlyTaxes, estimate.incomeTax()));
        BigDecimal socialContributions = TaxMath.money(resolveSocialContributions(yearlyTaxes, estimate.socialContributions()));
        BigDecimal vatLiability = TaxMath.money(resolveVatLiability(yearlyTaxes, estimate.vatToPay()));
        BigDecimal subtotal = TaxMath.money(incomeTax.add(socialContributions));
        BigDecimal shouldSetAside = TaxMath.money(subtotal.add(vatLiability));
        BigDecimal alreadySaved = TaxMath.money(resolveAlreadySaved(userId, yearlyTransactions, yearlyTaxes));
        BigDecimal missing = TaxMath.money(TaxMath.maxZero(shouldSetAside.subtract(alreadySaved)));
        BigDecimal completionPercentage = TaxMath.percentage(alreadySaved, shouldSetAside);
        BigDecimal weeklyTarget = TaxMath.money(computeWeeklyTarget(missing, targetYear));
        BigDecimal safeToSpend = TaxMath.money(TaxMath.maxZero(grossIncome.subtract(shouldSetAside)));

        return new TaxBufferComputation(
                grossIncome,
                taxableIncome,
                incomeTax,
                socialContributions,
                subtotal,
                vatLiability,
                shouldSetAside,
                alreadySaved,
                missing,
                completionPercentage,
                weeklyTarget,
                safeToSpend
        );
    }

    private BigDecimal resolveIncomeTax(List<Tax> taxes, BigDecimal estimatedIncomeTax) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("income", "irpef"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return estimatedIncomeTax;
    }

    private BigDecimal resolveSocialContributions(List<Tax> taxes, BigDecimal estimatedSocialContributions) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("social", "contribut", "inps"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return estimatedSocialContributions;
    }

    private BigDecimal resolveVatLiability(List<Tax> taxes, BigDecimal estimatedVatLiability) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("vat", "iva", "btw", "tva", "mwst"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return estimatedVatLiability;
    }

    private BigDecimal resolveAlreadySaved(String userId, List<Transaction> yearlyTransactions, List<Tax> yearlyTaxes) {
        List<BankAccount> taxBufferAccounts = bankAccountRepository.findByUserIdAndIsForTax(userId, true);
        if (!taxBufferAccounts.isEmpty()) {
            return taxBufferAccounts.stream()
                    .map(BankAccount::getBalance)
                    .filter(balance -> balance != null && balance.compareTo(BigDecimal.ZERO) > 0)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal fromTransactions = yearlyTransactions.stream()
                .filter(transaction -> transaction.getAmount() != null && transaction.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .filter(this::isBufferRelatedTransaction)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (fromTransactions.compareTo(BigDecimal.ZERO) > 0) {
            return fromTransactions;
        }

        return yearlyTaxes.stream()
                .filter(tax -> tax.getAmount() != null)
                .filter(tax -> TaxDeadlineSupport.isPaidStatus(tax.getStatus()))
                .map(Tax::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumPositiveAmounts(List<Transaction> transactions) {
        return transactions.stream()
                .map(Transaction::getAmount)
                .filter(amount -> amount != null && amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumAbsoluteNegativeAmounts(List<Transaction> transactions) {
        return transactions.stream()
                .map(Transaction::getAmount)
                .filter(amount -> amount != null && amount.compareTo(BigDecimal.ZERO) < 0)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumTaxAmountsByKeywords(List<Tax> taxes, List<String> keywords) {
        return taxes.stream()
                .filter(tax -> tax.getAmount() != null)
                .filter(tax -> containsAnyKeyword(tax.getName(), keywords))
                .map(Tax::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isBufferRelatedTransaction(Transaction transaction) {
        return containsAnyKeyword(transaction.getCategory(), List.of("buffer", "tax", "vat", "f24", "save"))
                || containsAnyKeyword(transaction.getDescription(), List.of("buffer", "tax", "vat", "f24", "save"));
    }

    private boolean containsAnyKeyword(String source, List<String> keywords) {
        if (source == null) {
            return false;
        }

        String normalized = source.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal computeWeeklyTarget(BigDecimal missing, int year) {
        if (missing.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        LocalDate now = LocalDate.now();
        LocalDate targetDate = LocalDate.of(year, 12, 31);
        if (now.isAfter(targetDate)) {
            return missing;
        }

        long daysRemaining = ChronoUnit.DAYS.between(now, targetDate) + 1;
        long weeksRemaining = Math.max(1, (long) Math.ceil(daysRemaining / 7.0));
        return missing.divide(BigDecimal.valueOf(weeksRemaining), TaxMath.MONEY_SCALE, java.math.RoundingMode.HALF_UP);
    }
}
