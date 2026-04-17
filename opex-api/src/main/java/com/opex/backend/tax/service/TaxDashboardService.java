package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.user.model.User;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TaxDashboardService {

    private final TaxRepository taxRepository;
    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final UserRepository userRepository;
    private final TaxEstimationService taxEstimationService;
    private final TaxDeadlineService taxDeadlineService;

    public TaxBufferDashboardResponse getTaxBufferDashboard(String userId,
                                                            String connectionId,
                                                            Integer year,
                                                            int deadlinesLimit,
                                                            int activityLimit) {
        int targetYear = resolveYear(year);
        validateConnectionOwnership(userId, connectionId);

        User user = resolveUser(userId);
        TaxUserContext userContext = new TaxUserContext(user);
        List<Transaction> yearlyTransactions = filterTransactionsByYear(getTransactionsForScope(userId, connectionId), targetYear);
        List<Tax> yearlyTaxes = getTaxesForYear(userId, targetYear);

        BigDecimal grossIncome = TaxMath.money(sumPositiveAmounts(yearlyTransactions));
        BigDecimal businessExpenses = TaxMath.money(sumAbsoluteNegativeAmounts(yearlyTransactions));
        TaxEstimate estimate = taxEstimationService.estimate(user, grossIncome, businessExpenses);
        BigDecimal taxableIncome = estimate.taxableIncome();
        BigDecimal incomeTax = TaxMath.money(resolveIncomeTax(yearlyTaxes, estimate.incomeTax()));
        BigDecimal socialContributions = TaxMath.money(resolveSocialContributions(yearlyTaxes, estimate.socialContributions()));
        BigDecimal vatRate = userContext.resolveVatRate();
        BigDecimal vatLiability = TaxMath.money(resolveVatLiability(yearlyTaxes, estimate.vatToPay()));
        BigDecimal subtotal = TaxMath.money(incomeTax.add(socialContributions));
        BigDecimal shouldSetAside = TaxMath.money(subtotal.add(vatLiability));
        BigDecimal alreadySaved = TaxMath.money(resolveAlreadySaved(userId, yearlyTransactions, yearlyTaxes));
        BigDecimal missing = TaxMath.money(TaxMath.maxZero(shouldSetAside.subtract(alreadySaved)));
        BigDecimal completionPercentage = TaxMath.percentage(alreadySaved, shouldSetAside);
        BigDecimal weeklyTarget = TaxMath.money(computeWeeklyTarget(missing, targetYear));
        BigDecimal safeToSpend = TaxMath.money(TaxMath.maxZero(grossIncome.subtract(shouldSetAside)));

        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines =
                taxDeadlineService.getTaxDeadlines(userId, user, targetYear, deadlinesLimit);
        List<TaxBufferDashboardResponse.BufferActivityItem> activity =
                getBufferActivity(userId, connectionId, targetYear, activityLimit);
        List<TaxBufferDashboardResponse.ProviderItem> providers = getAvailableProviders(userId);
        TaxBufferDashboardResponse.SafeMode safeMode = buildSafeMode(missing, deadlines, targetYear);

        TaxBufferDashboardResponse.Summary summary = new TaxBufferDashboardResponse.Summary(
                shouldSetAside,
                alreadySaved,
                missing,
                completionPercentage,
                weeklyTarget,
                safeToSpend,
                LocalDate.of(targetYear, 12, 31)
        );

        TaxBufferDashboardResponse.IncomeSocialBreakdown incomeSocial = new TaxBufferDashboardResponse.IncomeSocialBreakdown(
                taxableIncome,
                incomeTax,
                socialContributions,
                subtotal
        );

        TaxBufferDashboardResponse.VatBreakdown vat = new TaxBufferDashboardResponse.VatBreakdown(
                userContext.resolveVatRegimeLabel(),
                vatRate,
                vatLiability,
                userContext.resolveVatWarning(grossIncome)
        );

        List<TaxBufferDashboardResponse.LiabilityItem> liabilitySplit = List.of(
                toLiabilityItem("VAT", vatLiability, shouldSetAside),
                toLiabilityItem("Income Tax", incomeTax, shouldSetAside),
                toLiabilityItem("Social Contributions", socialContributions, shouldSetAside)
        );

        return new TaxBufferDashboardResponse(
                isBlank(connectionId) ? null : connectionId,
                targetYear,
                resolveCurrency(yearlyTaxes),
                summary,
                incomeSocial,
                vat,
                liabilitySplit,
                deadlines,
                activity,
                providers,
                safeMode
        );
    }

    public List<TaxBufferDashboardResponse.ProviderItem> getAvailableProviders(String userId) {
        return bankConnectionRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(BankConnection::getProviderName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(connection -> new TaxBufferDashboardResponse.ProviderItem(
                        connection.getId(),
                        connection.getProviderName(),
                        connection.getStatus()
                ))
                .collect(Collectors.toList());
    }

    public List<TaxBufferDashboardResponse.BufferActivityItem> getBufferActivity(String userId,
                                                                                 String connectionId,
                                                                                 Integer year,
                                                                                 int limit) {
        int targetYear = resolveYear(year);
        int safeLimit = Math.max(limit, 1);
        validateConnectionOwnership(userId, connectionId);

        List<Transaction> yearlyTransactions = filterTransactionsByYear(getTransactionsForScope(userId, connectionId), targetYear);
        List<Tax> yearlyTaxes = getTaxesForYear(userId, targetYear);

        List<TaxBufferDashboardResponse.BufferActivityItem> transactionEvents = yearlyTransactions.stream()
                .filter(transaction -> transaction.getBookingDate() != null)
                .map(this::toTransactionActivityItem)
                .collect(Collectors.toList());

        List<TaxBufferDashboardResponse.BufferActivityItem> paidTaxEvents = yearlyTaxes.stream()
                .filter(tax -> TaxDeadlineSupport.isPaidStatus(tax.getStatus()))
                .filter(tax -> tax.getDeadline() != null)
                .map(this::toPaidTaxActivityItem)
                .collect(Collectors.toList());

        return Stream.concat(transactionEvents.stream(), paidTaxEvents.stream())
                .sorted(Comparator.comparing(
                        TaxBufferDashboardResponse.BufferActivityItem::getDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(safeLimit)
                .collect(Collectors.toList());
    }

    private TaxBufferDashboardResponse.BufferActivityItem toTransactionActivityItem(Transaction transaction) {
        BigDecimal amount = TaxMath.money(Optional.ofNullable(transaction.getAmount()).orElse(BigDecimal.ZERO));
        return new TaxBufferDashboardResponse.BufferActivityItem(
                "txn_" + transaction.getId(),
                resolveActivityTitle(transaction),
                transaction.getBookingDate(),
                amount,
                amount.compareTo(BigDecimal.ZERO) >= 0 ? "IN" : "OUT"
        );
    }

    private TaxBufferDashboardResponse.BufferActivityItem toPaidTaxActivityItem(Tax tax) {
        return new TaxBufferDashboardResponse.BufferActivityItem(
                "tax_" + tax.getId(),
                "Tax Payment: " + Optional.ofNullable(tax.getName()).orElse("Tax"),
                tax.getDeadline(),
                TaxMath.money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO).abs().negate()),
                "OUT"
        );
    }

    private String resolveActivityTitle(Transaction transaction) {
        String blob = (Optional.ofNullable(transaction.getCategory()).orElse("") + " "
                + Optional.ofNullable(transaction.getDescription()).orElse("")).toLowerCase(Locale.ROOT);

        if (blob.contains("salary") || blob.contains("stipend")) {
            return "Monthly Automatic Save";
        }
        if (blob.contains("top-up") || blob.contains("top up") || blob.contains("ricarica")) {
            return "Manual Buffer Top-up";
        }
        if (blob.contains("vat") || blob.contains("iva")) {
            return "VAT Payment";
        }
        if (blob.contains("tax") || blob.contains("f24") || blob.contains("imposta")) {
            return "Tax Payment";
        }
        return "Buffer Adjustment";
    }

    private List<Tax> getTaxesForYear(String userId, int year) {
        return taxRepository.findByUserIdOrderByDeadlineAsc(userId).stream()
                .filter(tax -> tax.getDeadline() == null || tax.getDeadline().getYear() == year)
                .collect(Collectors.toList());
    }

    private List<Transaction> getTransactionsForScope(String userId, String connectionId) {
        if (isBlank(connectionId)) {
            return transactionRepository.findByUserId(userId);
        }
        return transactionRepository.findByUserIdAndConnectionId(userId, connectionId);
    }

    private List<Transaction> filterTransactionsByYear(List<Transaction> transactions, int year) {
        return transactions.stream()
                .filter(transaction -> transaction.getBookingDate() != null)
                .filter(transaction -> transaction.getBookingDate().getYear() == year)
                .collect(Collectors.toList());
    }

    private void validateConnectionOwnership(String userId, String connectionId) {
        if (isBlank(connectionId)) {
            return;
        }

        bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Connessione non trovata o non autorizzata"));
    }

    private User resolveUser(String userId) {
        return userRepository.findById(userId).orElseGet(() -> {
            User user = new User();
            user.setId(userId);
            return user;
        });
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

    private TaxBufferDashboardResponse.LiabilityItem toLiabilityItem(String label, BigDecimal amount, BigDecimal total) {
        BigDecimal normalizedAmount = TaxMath.money(amount);
        return new TaxBufferDashboardResponse.LiabilityItem(label, normalizedAmount, TaxMath.percentage(normalizedAmount, total));
    }

    private TaxBufferDashboardResponse.SafeMode buildSafeMode(BigDecimal missing,
                                                              List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines,
                                                              int year) {
        long overdueDeadlines = deadlines.stream()
                .filter(item -> Optional.ofNullable(item.getStatus()).orElse("").toLowerCase(Locale.ROOT).contains("overdue"))
                .count();

        if (overdueDeadlines > 0) {
            return new TaxBufferDashboardResponse.SafeMode(
                    false,
                    "You have overdue tax deadlines.",
                    "Prioritize overdue liabilities before moving more cash to discretionary spending."
            );
        }

        if (missing.compareTo(BigDecimal.ZERO) > 0) {
            return new TaxBufferDashboardResponse.SafeMode(
                    false,
                    "Current buffer is below the estimated target for " + year + ".",
                    "Increase weekly saves until the missing amount reaches zero."
            );
        }

        return new TaxBufferDashboardResponse.SafeMode(
                true,
                "Your buffer is aligned with the estimated liabilities for " + year + ".",
                "Keep the current saving rhythm and review again after new income lands."
        );
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

    private String resolveCurrency(List<Tax> taxes) {
        return taxes.stream()
                .map(Tax::getCurrency)
                .filter(currency -> currency != null && !currency.isBlank())
                .findFirst()
                .orElse(TaxMath.DEFAULT_CURRENCY);
    }

    private int resolveYear(Integer year) {
        return year != null ? year : LocalDate.now().getYear();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
