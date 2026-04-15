package com.opex.backend.service;

import com.opex.backend.dto.TaxBufferDashboardResponse;
import com.opex.backend.dto.TaxRequest;
import com.opex.backend.model.BankAccount;
import com.opex.backend.model.BankConnection;
import com.opex.backend.model.Tax;
import com.opex.backend.model.Transaction;
import com.opex.backend.model.User;
import com.opex.backend.repository.BankAccountRepository;
import com.opex.backend.repository.BankConnectionRepository;
import com.opex.backend.repository.TaxRepository;
import com.opex.backend.repository.TransactionRepository;
import com.opex.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TaxService {

    private static final BigDecimal VAT_FALLBACK_RATE = new BigDecimal("0.21");
    private static final BigDecimal VAT_GERMANY_RATE = new BigDecimal("0.19");
    private static final BigDecimal VAT_ITALY_RATE = new BigDecimal("0.22");
    private static final BigDecimal ZERO_RATE = new BigDecimal("0.00");
    private static final BigDecimal DUTCH_KOR_THRESHOLD = new BigDecimal("20000");
    private static final int MONEY_SCALE = 2;
    private static final String DEFAULT_CURRENCY = "EUR";

    // 🇳🇱 Netherlands
    private static final BigDecimal NL_BRACKET_1_LIMIT = new BigDecimal("75000");
    private static final BigDecimal NL_BRACKET_1_RATE = new BigDecimal("0.3697");
    private static final BigDecimal NL_BRACKET_2_RATE = new BigDecimal("0.4950");
    private static final BigDecimal NL_SELF_EMPLOYED_DEDUCTION = new BigDecimal("5030");
    private static final BigDecimal NL_SME_FACTOR = new BigDecimal("0.86");
    private static final BigDecimal NL_TAX_CREDIT = new BigDecimal("3000");

    // 🇧🇪 Belgium — social contributions
    private static final BigDecimal BE_SOC_B1_LIMIT = new BigDecimal("75024.54");
    private static final BigDecimal BE_SOC_RATE_1 = new BigDecimal("0.205");
    private static final BigDecimal BE_SOC_B2_LIMIT = new BigDecimal("110562.42");
    private static final BigDecimal BE_SOC_RATE_2 = new BigDecimal("0.1416");
    private static final BigDecimal BE_SOC_MIN_BASE = new BigDecimal("17374.08");
    private static final BigDecimal BE_SIDE_LOWER = new BigDecimal("1922.16");
    private static final BigDecimal BE_SIDE_RATE = new BigDecimal("0.105");
    // 🇧🇪 Belgium — income tax
    private static final BigDecimal BE_TAX_B1_LIMIT = new BigDecimal("15200");
    private static final BigDecimal BE_TAX_B2_LIMIT = new BigDecimal("26830");
    private static final BigDecimal BE_TAX_B3_LIMIT = new BigDecimal("46440");
    private static final BigDecimal BE_TAX_CREDIT = new BigDecimal("2000");
    private static final BigDecimal BE_VAT_THRESHOLD = new BigDecimal("25000");

    // 🇩🇪 Germany
    private static final BigDecimal DE_HEALTH_RATE = new BigDecimal("0.16");
    private static final BigDecimal DE_MIN_HEALTH = new BigDecimal("2500");
    private static final BigDecimal DE_TAX_FREE_LIMIT = new BigDecimal("11604");
    private static final BigDecimal DE_TAX_B2_LIMIT = new BigDecimal("30000");
    private static final BigDecimal DE_TAX_B3_LIMIT = new BigDecimal("70000");
    private static final BigDecimal DE_VAT_THRESHOLD = new BigDecimal("22000");

    // 🇮🇹 Italy
    private static final BigDecimal IT_FORFETTARIO_COEFF_PROFESSIONAL = new BigDecimal("0.78");
    private static final BigDecimal IT_FORFETTARIO_COEFF_RETAIL      = new BigDecimal("0.40");
    private static final BigDecimal IT_FORFETTARIO_COEFF_CONSTRUCTION = new BigDecimal("0.86");
    private static final BigDecimal IT_FORFETTARIO_COEFF_OTHER        = new BigDecimal("0.67");
    private static final BigDecimal IT_INPS_RATE = new BigDecimal("0.26");
    private static final BigDecimal IT_STARTUP_RATE = new BigDecimal("0.05");
    private static final BigDecimal IT_FORFETTARIO_RATE = new BigDecimal("0.15");
    private static final BigDecimal IT_IRPEF_B1_LIMIT = new BigDecimal("28000");
    private static final BigDecimal IT_IRPEF_B2_LIMIT = new BigDecimal("50000");

    private final TaxRepository taxRepository;
    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final UserRepository userRepository;

    public Page<Tax> getUserTaxes(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        return taxRepository.findByUserId(userId, pageable);
    }

    public TaxBufferDashboardResponse getTaxBufferDashboard(String userId,
                                                            String connectionId,
                                                            Integer year,
                                                            int deadlinesLimit,
                                                            int activityLimit) {
        int targetYear = resolveYear(year);
        validateConnectionOwnership(userId, connectionId);

        User user = resolveUser(userId);
        List<Transaction> yearlyTransactions = filterTransactionsByYear(getTransactionsForScope(userId, connectionId), targetYear);
        List<Tax> yearlyTaxes = getTaxesForYear(userId, targetYear);

        BigDecimal grossIncome = money(sumPositiveAmounts(yearlyTransactions));
        BigDecimal businessExpenses = money(sumAbsoluteNegativeAmounts(yearlyTransactions));
        TaxEstimate estimate = computeTaxEstimate(user, grossIncome, businessExpenses);
        BigDecimal taxableIncome = estimate.taxableIncome;
        BigDecimal incomeTax = money(resolveIncomeTax(yearlyTaxes, estimate.incomeTax));
        BigDecimal socialContributions = money(resolveSocialContributions(yearlyTaxes, estimate.socialContributions));
        BigDecimal vatRate = resolveVatRate(user);
        BigDecimal vatLiability = money(resolveVatLiability(user, yearlyTaxes, estimate.vatToPay));
        BigDecimal subtotal = money(incomeTax.add(socialContributions));
        BigDecimal shouldSetAside = money(subtotal.add(vatLiability));
        BigDecimal alreadySaved = money(resolveAlreadySaved(userId, yearlyTransactions, yearlyTaxes));
        BigDecimal missing = money(maxZero(shouldSetAside.subtract(alreadySaved)));
        BigDecimal completionPercentage = percentage(alreadySaved, shouldSetAside);
        BigDecimal weeklyTarget = money(computeWeeklyTarget(missing, targetYear));
        BigDecimal safeToSpend = money(maxZero(grossIncome.subtract(shouldSetAside)));

        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = getTaxDeadlines(userId, targetYear, deadlinesLimit);
        List<TaxBufferDashboardResponse.BufferActivityItem> activity = getBufferActivity(userId, connectionId, targetYear, activityLimit);
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
                resolveVatRegimeLabel(user),
                vatRate,
                vatLiability,
                resolveVatWarning(user, grossIncome)
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

    public List<TaxBufferDashboardResponse.TaxDeadlineItem> getTaxDeadlines(String userId, Integer year, int limit) {
        int targetYear = resolveYear(year);
        int safeLimit = Math.max(limit, 1);
        User user = resolveUser(userId);

        return buildMergedDeadlines(userId, user, targetYear).stream()
                .sorted(deadlineComparator())
                .limit(safeLimit)
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
                .filter(tax -> isPaidStatus(tax.getStatus()))
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

    public String exportCalendar(String userId, Integer year) {
        int targetYear = resolveYear(year);
        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = getTaxDeadlines(userId, targetYear, Integer.MAX_VALUE);
        String nowUtc = LocalDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Opex//Tax Buffer//EN\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");

        for (TaxBufferDashboardResponse.TaxDeadlineItem item : deadlines) {
            if (item.getDueDate() == null) {
                continue;
            }

            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:").append(escapeIcsText(resolveDeadlineIdentity(item))).append("@opex\r\n");
            sb.append("DTSTAMP:").append(nowUtc).append("\r\n");
            sb.append("DTSTART;VALUE=DATE:").append(item.getDueDate().format(DateTimeFormatter.BASIC_ISO_DATE)).append("\r\n");
            sb.append("SUMMARY:").append(escapeIcsText(Optional.ofNullable(item.getTitle()).orElse("Tax deadline"))).append("\r\n");
            sb.append("DESCRIPTION:").append(escapeIcsText(Optional.ofNullable(item.getDescription())
                    .orElse("Tax deadline - status: " + Optional.ofNullable(item.getStatus()).orElse("Upcoming")))).append("\r\n");
            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    @Transactional
    public Tax createLocalTax(String userId, TaxRequest request) {
        Tax tax = new Tax();
        tax.setId("tax_local_" + UUID.randomUUID());
        tax.setUserId(userId);
        tax.setIsExternal(false);
        tax.setDeadline(request.getDeadline());
        tax.setName(request.getName());
        tax.setStatus(Optional.ofNullable(request.getStatus()).filter(value -> !value.isBlank()).orElse("PENDING"));
        tax.setAmount(money(Optional.ofNullable(request.getAmount()).orElse(BigDecimal.ZERO)));
        tax.setCurrency(Optional.ofNullable(request.getCurrency()).filter(value -> !value.isBlank()).orElse(DEFAULT_CURRENCY));
        return taxRepository.save(tax);
    }

    @Transactional
    public Tax updateLocalTax(String userId, String taxId, TaxRequest request) {
        Tax tax = taxRepository.findByIdAndUserId(taxId, userId)
                .orElseThrow(() -> new RuntimeException("Tassa non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(tax.getIsExternal())) {
            throw new RuntimeException("Impossibile modificare una scadenza fiscale generata da un servizio esterno.");
        }

        if (request.getDeadline() != null) {
            tax.setDeadline(request.getDeadline());
        }
        if (request.getName() != null) {
            tax.setName(request.getName());
        }
        if (request.getStatus() != null) {
            tax.setStatus(request.getStatus());
        }
        if (request.getAmount() != null) {
            tax.setAmount(money(request.getAmount()));
        }
        if (request.getCurrency() != null) {
            tax.setCurrency(request.getCurrency());
        }

        return taxRepository.save(tax);
    }

    @Transactional
    public void deleteLocalTax(String userId, String taxId) {
        Tax tax = taxRepository.findByIdAndUserId(taxId, userId)
                .orElseThrow(() -> new RuntimeException("Tassa non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(tax.getIsExternal())) {
            throw new RuntimeException("Impossibile cancellare una scadenza fiscale generata da un servizio esterno.");
        }

        taxRepository.delete(tax);
    }

    private List<TaxBufferDashboardResponse.TaxDeadlineItem> buildMergedDeadlines(String userId, User user, int targetYear) {
        Map<String, TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = new LinkedHashMap<>();

        buildGeneratedDeadlines(user, targetYear).forEach(item -> deadlines.put(resolveDeadlineIdentity(item), item));

        taxRepository.findByUserIdOrderByDeadlineAsc(userId).stream()
                .filter(tax -> tax.getDeadline() != null)
                .filter(tax -> tax.getDeadline().getYear() == targetYear)
                .map(this::toStoredDeadlineItem)
                .forEach(item -> deadlines.put(resolveDeadlineIdentity(item), item));

        return new ArrayList<>(deadlines.values());
    }

    private List<TaxBufferDashboardResponse.TaxDeadlineItem> buildGeneratedDeadlines(User user, int targetYear) {
        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = new ArrayList<>();

        if (isDutchResidence(user)) {
            addDutchVatDeadlines(deadlines, user, targetYear);
            addDutchIncomeTaxDeadlines(deadlines, targetYear);
        }

        return deadlines;
    }

    private void addDutchVatDeadlines(List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines, User user, int targetYear) {
        String vatFrequency = normalizeVatFrequency(user.getVatFrequency());
        if ("monthly".equals(vatFrequency)) {
            String[] monthLabels = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            for (int month = 1; month <= 12; month++) {
                LocalDate periodEnd = LocalDate.of(targetYear, month, 1).with(TemporalAdjusters.lastDayOfMonth());
                LocalDate dueDate = periodEnd.plusMonths(1).with(TemporalAdjusters.lastDayOfMonth());
                String periodLabel = monthLabels[month - 1] + " " + targetYear;
                deadlines.add(newGeneratedDeadline(
                        "generated-vat-" + targetYear + "-" + month,
                        "VAT return",
                        dueDate,
                        "VAT",
                        periodLabel,
                        "Submit and pay Dutch VAT for " + periodLabel + "."
                ));
            }
            return;
        }

        if ("yearly".equals(vatFrequency)) {
            deadlines.add(newGeneratedDeadline(
                    "generated-vat-yearly-" + targetYear,
                    "Annual VAT return",
                    LocalDate.of(targetYear + 1, 3, 31),
                    "VAT",
                    String.valueOf(targetYear),
                    "Submit the annual Dutch VAT return for " + targetYear + "."
            ));
            return;
        }

        deadlines.add(newGeneratedDeadline(
                "generated-vat-q4-" + (targetYear - 1),
                "VAT return",
                LocalDate.of(targetYear, 1, 31),
                "VAT",
                "Q4 " + (targetYear - 1),
                "Submit and pay Dutch VAT for Q4 " + (targetYear - 1) + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q1-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear, 4, 30),
                "VAT",
                "Q1 " + targetYear,
                "Submit and pay Dutch VAT for Q1 " + targetYear + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q2-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear, 7, 31),
                "VAT",
                "Q2 " + targetYear,
                "Submit and pay Dutch VAT for Q2 " + targetYear + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q3-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear, 10, 31),
                "VAT",
                "Q3 " + targetYear,
                "Submit and pay Dutch VAT for Q3 " + targetYear + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q4-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear + 1, 1, 31),
                "VAT",
                "Q4 " + targetYear,
                "Submit and pay Dutch VAT for Q4 " + targetYear + "."
        ));
    }

    private void addDutchIncomeTaxDeadlines(List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines, int targetYear) {
        String periodLabel = String.valueOf(targetYear - 1);
        LocalDate dueDate = LocalDate.of(targetYear, 5, 1);

        deadlines.add(newGeneratedDeadline(
                "generated-income-tax-return-" + targetYear,
                "Income tax return",
                dueDate,
                "Income Tax",
                periodLabel,
                "File the Dutch income tax return for fiscal year " + periodLabel + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-income-tax-postponement-" + targetYear,
                "Income tax postponement request",
                dueDate,
                "Income Tax",
                periodLabel,
                "Request a postponement if the annual Dutch income tax return for " + periodLabel + " cannot be filed in time."
        ));
    }

    private TaxBufferDashboardResponse.TaxDeadlineItem newGeneratedDeadline(String id,
                                                                            String title,
                                                                            LocalDate dueDate,
                                                                            String category,
                                                                            String periodLabel,
                                                                            String description) {
        return new TaxBufferDashboardResponse.TaxDeadlineItem(
                id,
                title,
                dueDate,
                resolveDeadlineStatus(null, dueDate),
                money(BigDecimal.ZERO),
                DEFAULT_CURRENCY,
                category,
                periodLabel,
                description,
                true
        );
    }

    private TaxBufferDashboardResponse.TaxDeadlineItem toStoredDeadlineItem(Tax tax) {
        return new TaxBufferDashboardResponse.TaxDeadlineItem(
                tax.getId(),
                Optional.ofNullable(tax.getName()).filter(name -> !name.isBlank()).orElse("Tax deadline"),
                tax.getDeadline(),
                resolveDeadlineStatus(tax.getStatus(), tax.getDeadline()),
                money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO).abs()),
                Optional.ofNullable(tax.getCurrency()).filter(currency -> !currency.isBlank()).orElse(DEFAULT_CURRENCY),
                resolveTaxCategory(tax),
                null,
                null,
                false
        );
    }

    private TaxBufferDashboardResponse.BufferActivityItem toTransactionActivityItem(Transaction transaction) {
        BigDecimal amount = money(Optional.ofNullable(transaction.getAmount()).orElse(BigDecimal.ZERO));
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
                money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO).abs().negate()),
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
                .orElseThrow(() -> new RuntimeException("Connessione non trovata o non autorizzata"));
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

    private BigDecimal resolveVatLiability(User user, List<Tax> taxes, BigDecimal estimatedVatLiability) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("vat", "iva", "btw", "tva", "mwst"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return estimatedVatLiability;
    }

    private BigDecimal resolveAlreadySaved(String userId, List<Transaction> yearlyTransactions, List<Tax> yearlyTaxes) {
        // Primary source: aggregate balance of all accounts tagged as tax buffer
        List<BankAccount> taxBufferAccounts = bankAccountRepository.findByUserIdAndIsForTax(userId, true);
        if (!taxBufferAccounts.isEmpty()) {
            return taxBufferAccounts.stream()
                    .map(BankAccount::getBalance)
                    .filter(b -> b != null && b.compareTo(BigDecimal.ZERO) > 0)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Fallback: buffer-tagged transactions in the year
        BigDecimal fromTransactions = yearlyTransactions.stream()
                .filter(transaction -> transaction.getAmount() != null && transaction.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .filter(this::isBufferRelatedTransaction)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (fromTransactions.compareTo(BigDecimal.ZERO) > 0) {
            return fromTransactions;
        }

        // Last fallback: paid tax records
        return yearlyTaxes.stream()
                .filter(tax -> tax.getAmount() != null)
                .filter(tax -> isPaidStatus(tax.getStatus()))
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

    private String resolveTaxCategory(Tax tax) {
        String name = Optional.ofNullable(tax.getName()).orElse("").toLowerCase(Locale.ROOT);
        if (containsAnyKeyword(name, List.of("vat", "iva", "btw", "tva", "mwst"))) {
            return "VAT";
        }
        if (containsAnyKeyword(name, List.of("income", "irpef"))) {
            return "Income Tax";
        }
        if (containsAnyKeyword(name, List.of("social", "contribut", "inps"))) {
            return "Social";
        }
        return Boolean.TRUE.equals(tax.getIsExternal()) ? "Imported" : "Manual";
    }

    private TaxBufferDashboardResponse.LiabilityItem toLiabilityItem(String label, BigDecimal amount, BigDecimal total) {
        BigDecimal normalizedAmount = money(amount);
        return new TaxBufferDashboardResponse.LiabilityItem(label, normalizedAmount, percentage(normalizedAmount, total));
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
        return missing.divide(BigDecimal.valueOf(weeksRemaining), MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal percentage(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) <= 0) {
            return ZERO_RATE;
        }

        BigDecimal rawPercentage = numerator
                .divide(denominator, 6, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        if (rawPercentage.compareTo(new BigDecimal("100")) > 0) {
            rawPercentage = new BigDecimal("100");
        }

        return rawPercentage.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal maxZero(BigDecimal value) {
        return value.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : value;
    }

    private BigDecimal money(BigDecimal value) {
        return Optional.ofNullable(value)
                .orElse(BigDecimal.ZERO)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private String resolveCurrency(List<Tax> taxes) {
        return taxes.stream()
                .map(Tax::getCurrency)
                .filter(currency -> currency != null && !currency.isBlank())
                .findFirst()
                .orElse(DEFAULT_CURRENCY);
    }

    private String resolveVatRegimeLabel(User user) {
        if (isVatExempt(user)) {
            return isDutchResidence(user) ? "KOR" : "VAT exempt";
        }
        return "Standard VAT";
    }

    private BigDecimal resolveVatRate(User user) {
        if (isVatExempt(user)) {
            return ZERO_RATE;
        }
        if (isGermanResidence(user)) {
            return VAT_GERMANY_RATE;
        }
        if (isItalianResidence(user)) {
            return VAT_ITALY_RATE;
        }
        return VAT_FALLBACK_RATE;
    }

    private String resolveVatWarning(User user, BigDecimal grossIncome) {
        if (isDutchResidence(user) && isVatExempt(user) && grossIncome.compareTo(DUTCH_KOR_THRESHOLD) > 0) {
            return "Estimated turnover exceeds the typical Dutch KOR threshold.";
        }
        if (isBelgianResidence(user) && isVatExempt(user) && grossIncome.compareTo(BE_VAT_THRESHOLD) > 0) {
            return "Estimated turnover exceeds the Belgian VAT exemption threshold.";
        }
        if (isGermanResidence(user) && isVatExempt(user) && grossIncome.compareTo(DE_VAT_THRESHOLD) > 0) {
            return "Estimated turnover exceeds the German Kleinunternehmer threshold.";
        }
        return null;
    }

    private boolean isVatExempt(User user) {
        if (user == null) {
            return false;
        }
        if (Boolean.TRUE.equals(user.getVatExempt())) {
            return true;
        }

        String normalizedRegime = Optional.ofNullable(user.getTaxRegime()).orElse("").toLowerCase(Locale.ROOT);
        if (normalizedRegime.contains("kor")) {
            return true;
        }
        return isItalianResidence(user) && normalizedRegime.contains("forfett");
    }

    private boolean isDutchResidence(User user) {
        return normalizeResidence(user).contains("netherlands") || normalizeResidence(user).contains("(nl)");
    }

    private boolean isGermanResidence(User user) {
        return normalizeResidence(user).contains("germany") || normalizeResidence(user).contains("(de)");
    }

    private boolean isItalianResidence(User user) {
        return normalizeResidence(user).contains("italy") || normalizeResidence(user).contains("(it)");
    }

    private String normalizeResidence(User user) {
        return Optional.ofNullable(user.getFiscalResidence())
                .filter(value -> !value.isBlank())
                .or(() -> Optional.ofNullable(user.getResidence()).filter(value -> !value.isBlank()))
                .orElse("")
                .toLowerCase(Locale.ROOT);
    }

    private String normalizeVatFrequency(String vatFrequency) {
        String normalized = Optional.ofNullable(vatFrequency).orElse("").trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("month")) {
            return "monthly";
        }
        if (normalized.contains("year")) {
            return "yearly";
        }
        return "quarterly";
    }

    private String resolveDeadlineStatus(String status, LocalDate dueDate) {
        if (isPaidStatus(status)) {
            return "PAID".equalsIgnoreCase(Optional.ofNullable(status).orElse("")) ? "Paid" : "Completed";
        }
        if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
            return "Overdue";
        }
        return "Upcoming";
    }

    private boolean isPaidStatus(String status) {
        if (status == null) {
            return false;
        }

        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return "PAID".equals(normalized) || "COMPLETED".equals(normalized);
    }

    private Comparator<TaxBufferDashboardResponse.TaxDeadlineItem> deadlineComparator() {
        return Comparator.comparing(
                        TaxBufferDashboardResponse.TaxDeadlineItem::getDueDate,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(item -> Optional.ofNullable(item.getTitle()).orElse(""), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(item -> Optional.ofNullable(item.getPeriodLabel()).orElse(""), String.CASE_INSENSITIVE_ORDER);
    }

    private String resolveDeadlineIdentity(TaxBufferDashboardResponse.TaxDeadlineItem item) {
        String id = Optional.ofNullable(item.getId()).orElse("").trim();
        if (!id.isEmpty()) {
            return id;
        }

        return (Optional.ofNullable(item.getTitle()).orElse("").trim().toLowerCase(Locale.ROOT) + "|"
                + Optional.ofNullable(item.getDueDate()).map(LocalDate::toString).orElse("") + "|"
                + Optional.ofNullable(item.getPeriodLabel()).orElse("").trim().toLowerCase(Locale.ROOT));
    }

    private int resolveYear(Integer year) {
        return year != null ? year : LocalDate.now().getYear();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isBelgianResidence(User user) {
        return normalizeResidence(user).contains("belgium") || normalizeResidence(user).contains("(be)");
    }

    private boolean isForfettarioRegime(User user) {
        return Optional.ofNullable(user.getTaxRegime()).orElse("").toLowerCase(Locale.ROOT).contains("forfett");
    }

    private BigDecimal sumAbsoluteNegativeAmounts(List<Transaction> transactions) {
        return transactions.stream()
                .map(Transaction::getAmount)
                .filter(amount -> amount != null && amount.compareTo(BigDecimal.ZERO) < 0)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // -------------------------------------------------------------------------
    // Tax estimation engine
    // -------------------------------------------------------------------------

    private static class TaxEstimate {
        final BigDecimal taxableIncome;
        final BigDecimal incomeTax;
        final BigDecimal socialContributions;
        final BigDecimal vatToPay;

        TaxEstimate(BigDecimal taxableIncome, BigDecimal incomeTax,
                    BigDecimal socialContributions, BigDecimal vatToPay) {
            this.taxableIncome = taxableIncome;
            this.incomeTax = incomeTax;
            this.socialContributions = socialContributions;
            this.vatToPay = vatToPay;
        }
    }

    private TaxEstimate computeTaxEstimate(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        if (isDutchResidence(user)) {
            return computeNetherlandsTax(user, grossIncome, businessExpenses);
        }
        if (isBelgianResidence(user)) {
            return computeBelgiumTax(user, grossIncome, businessExpenses);
        }
        if (isGermanResidence(user)) {
            return computeGermanyTax(user, grossIncome, businessExpenses);
        }
        if (isItalianResidence(user)) {
            return computeItalyTax(user, grossIncome, businessExpenses);
        }
        return computeFallbackTax(user, grossIncome, businessExpenses);
    }

    // 🇳🇱 Netherlands
    private TaxEstimate computeNetherlandsTax(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        // 1. profit
        BigDecimal profit = maxZero(grossIncome.subtract(businessExpenses));

        // 2. zelfstandigenaftrek (self-employed deduction)
        // Default true: la form fiscale non espone questo flag, i freelancer qualificano tipicamente
        boolean selfEmployed = !Boolean.FALSE.equals(user.getSelfEmployed());
        if (selfEmployed) {
            profit = maxZero(profit.subtract(NL_SELF_EMPLOYED_DEDUCTION));
        }

        // 3. mkb-winstvrijstelling: always applies (14% exemption)
        profit = profit.multiply(NL_SME_FACTOR).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        // 4. taxable income
        BigDecimal taxable = maxZero(profit);

        // 5. income tax (progressive brackets)
        BigDecimal incomeTax;
        if (taxable.compareTo(NL_BRACKET_1_LIMIT) <= 0) {
            incomeTax = taxable.multiply(NL_BRACKET_1_RATE);
        } else {
            incomeTax = NL_BRACKET_1_LIMIT.multiply(NL_BRACKET_1_RATE)
                    .add(taxable.subtract(NL_BRACKET_1_LIMIT).multiply(NL_BRACKET_2_RATE));
        }

        // 6. algemene heffingskorting + arbeidskorting (MVP: fixed credit)
        incomeTax = maxZero(incomeTax.subtract(NL_TAX_CREDIT));

        // 7. VAT: KOR → 0; otherwise vat_collected - vat_deductible
        BigDecimal vatToPay;
        if (isVatExempt(user)) {
            vatToPay = BigDecimal.ZERO;
        } else {
            vatToPay = maxZero(grossIncome.subtract(businessExpenses).multiply(VAT_FALLBACK_RATE));
        }

        return new TaxEstimate(money(taxable), money(incomeTax), BigDecimal.ZERO, money(vatToPay));
    }

    // 🇧🇪 Belgium
    private TaxEstimate computeBelgiumTax(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        // 1. profit
        BigDecimal profit = maxZero(grossIncome.subtract(businessExpenses));

        // 2. VAT
        BigDecimal vatToPay;
        if (isVatExempt(user)) {
            vatToPay = BigDecimal.ZERO;
        } else {
            vatToPay = maxZero(grossIncome.subtract(businessExpenses).multiply(VAT_FALLBACK_RATE));
        }

        // 3. social contributions (calculated before income tax)
        // Default true: la form fiscale non espone questo flag, l'attività principale è il caso tipico
        boolean mainActivity = !Boolean.FALSE.equals(user.getMainActivity());
        BigDecimal social = mainActivity
                ? computeBelgiumMainActivitySocial(profit)
                : computeBelgiumSideActivitySocial(profit);

        // 4. taxable income = profit - social
        BigDecimal taxable = maxZero(profit.subtract(social));

        // 5. income tax (progressive brackets)
        BigDecimal incomeTax = computeBelgiumIncomeTax(taxable);

        // 6. tax reduction (MVP fixed amount)
        incomeTax = maxZero(incomeTax.subtract(BE_TAX_CREDIT));

        return new TaxEstimate(money(taxable), money(incomeTax), money(social), money(vatToPay));
    }

    private BigDecimal computeBelgiumMainActivitySocial(BigDecimal profit) {
        BigDecimal social;
        if (profit.compareTo(BigDecimal.ZERO) <= 0) {
            social = BigDecimal.ZERO;
        } else if (profit.compareTo(BE_SOC_B1_LIMIT) <= 0) {
            social = profit.multiply(BE_SOC_RATE_1);
        } else if (profit.compareTo(BE_SOC_B2_LIMIT) <= 0) {
            social = BE_SOC_B1_LIMIT.multiply(BE_SOC_RATE_1)
                    .add(profit.subtract(BE_SOC_B1_LIMIT).multiply(BE_SOC_RATE_2));
        } else {
            // above upper bracket: back to 20.5%
            social = BE_SOC_B1_LIMIT.multiply(BE_SOC_RATE_1)
                    .add(BE_SOC_B2_LIMIT.subtract(BE_SOC_B1_LIMIT).multiply(BE_SOC_RATE_2))
                    .add(profit.subtract(BE_SOC_B2_LIMIT).multiply(BE_SOC_RATE_1));
        }
        // minimum contribution for main activity
        BigDecimal minContrib = BE_SOC_MIN_BASE.multiply(BE_SOC_RATE_1);
        return social.max(minContrib);
    }

    private BigDecimal computeBelgiumSideActivitySocial(BigDecimal profit) {
        if (profit.compareTo(BE_SIDE_LOWER) <= 0) {
            return BigDecimal.ZERO;
        }
        if (profit.compareTo(BE_SOC_MIN_BASE) <= 0) {
            return profit.subtract(BE_SIDE_LOWER).multiply(BE_SIDE_RATE);
        }
        // above upper threshold: converge to ordinary rate
        return BE_SOC_MIN_BASE.subtract(BE_SIDE_LOWER).multiply(BE_SIDE_RATE)
                .add(profit.subtract(BE_SOC_MIN_BASE).multiply(BE_SOC_RATE_1));
    }

    private BigDecimal computeBelgiumIncomeTax(BigDecimal taxable) {
        if (taxable.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal tax = BigDecimal.ZERO;
        if (taxable.compareTo(BE_TAX_B1_LIMIT) <= 0) {
            return taxable.multiply(new BigDecimal("0.25"));
        }
        tax = BE_TAX_B1_LIMIT.multiply(new BigDecimal("0.25"));
        if (taxable.compareTo(BE_TAX_B2_LIMIT) <= 0) {
            return tax.add(taxable.subtract(BE_TAX_B1_LIMIT).multiply(new BigDecimal("0.40")));
        }
        tax = tax.add(BE_TAX_B2_LIMIT.subtract(BE_TAX_B1_LIMIT).multiply(new BigDecimal("0.40")));
        if (taxable.compareTo(BE_TAX_B3_LIMIT) <= 0) {
            return tax.add(taxable.subtract(BE_TAX_B2_LIMIT).multiply(new BigDecimal("0.45")));
        }
        tax = tax.add(BE_TAX_B3_LIMIT.subtract(BE_TAX_B2_LIMIT).multiply(new BigDecimal("0.45")));
        return tax.add(taxable.subtract(BE_TAX_B3_LIMIT).multiply(new BigDecimal("0.50")));
    }

    // 🇩🇪 Germany
    private TaxEstimate computeGermanyTax(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        // 1. profit
        BigDecimal profit = maxZero(grossIncome.subtract(businessExpenses));

        // 2. VAT: Kleinunternehmer → 0; otherwise 19%
        BigDecimal vatToPay;
        if (isVatExempt(user)) {
            vatToPay = BigDecimal.ZERO;
        } else {
            vatToPay = maxZero(grossIncome.subtract(businessExpenses).multiply(VAT_GERMANY_RATE));
        }

        // 3. health insurance (includes long-term care); pension = 0 (MVP)
        BigDecimal health = profit.multiply(DE_HEALTH_RATE).max(DE_MIN_HEALTH);
        BigDecimal social = health;

        // 4. taxable income
        BigDecimal taxable = maxZero(profit.subtract(social));

        // 5. income tax (simplified progressive brackets)
        BigDecimal incomeTax = computeGermanyIncomeTax(taxable);

        return new TaxEstimate(money(taxable), money(incomeTax), money(social), money(vatToPay));
    }

    private BigDecimal computeGermanyIncomeTax(BigDecimal taxable) {
        if (taxable.compareTo(DE_TAX_FREE_LIMIT) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal tax = BigDecimal.ZERO;
        if (taxable.compareTo(DE_TAX_B2_LIMIT) <= 0) {
            return taxable.subtract(DE_TAX_FREE_LIMIT).multiply(new BigDecimal("0.20"));
        }
        tax = DE_TAX_B2_LIMIT.subtract(DE_TAX_FREE_LIMIT).multiply(new BigDecimal("0.20"));
        if (taxable.compareTo(DE_TAX_B3_LIMIT) <= 0) {
            return tax.add(taxable.subtract(DE_TAX_B2_LIMIT).multiply(new BigDecimal("0.30")));
        }
        tax = tax.add(DE_TAX_B3_LIMIT.subtract(DE_TAX_B2_LIMIT).multiply(new BigDecimal("0.30")));
        return tax.add(taxable.subtract(DE_TAX_B3_LIMIT).multiply(new BigDecimal("0.42")));
    }

    // 🇮🇹 Italy
    private TaxEstimate computeItalyTax(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        if (isForfettarioRegime(user)) {
            return computeItalyForfettario(user, grossIncome);
        }
        return computeItalyOrdinario(grossIncome, businessExpenses);
    }

    private TaxEstimate computeItalyForfettario(User user, BigDecimal grossIncome) {
        // taxable base: coefficiente di redditività determinato dall'activityType
        BigDecimal coeff = resolveForfettarioCoefficient(user.getActivityType());
        BigDecimal taxableBase = grossIncome.multiply(coeff);
        BigDecimal inps = taxableBase.multiply(IT_INPS_RATE);
        BigDecimal taxable = maxZero(taxableBase.subtract(inps));
        // imposta sostitutiva: 5% startup, 15% standard
        BigDecimal rate = Boolean.TRUE.equals(user.getStartup()) ? IT_STARTUP_RATE : IT_FORFETTARIO_RATE;
        BigDecimal incomeTax = taxable.multiply(rate);
        // forfettario: no VAT
        return new TaxEstimate(money(taxable), money(incomeTax), money(inps), BigDecimal.ZERO);
    }

    private BigDecimal resolveForfettarioCoefficient(String activityType) {
        if (activityType == null) {
            return IT_FORFETTARIO_COEFF_PROFESSIONAL;
        }
        String normalized = activityType.toLowerCase(Locale.ROOT);
        if (normalized.contains("retail") || normalized.contains("e-commerce")
                || normalized.contains("food") || normalized.contains("hospitality")) {
            return IT_FORFETTARIO_COEFF_RETAIL; // 40%
        }
        if (normalized.contains("construction") || normalized.contains("real estate")) {
            return IT_FORFETTARIO_COEFF_CONSTRUCTION; // 86%
        }
        if (normalized.contains("other")) {
            return IT_FORFETTARIO_COEFF_OTHER; // 67%
        }
        // professional / consultant / default
        return IT_FORFETTARIO_COEFF_PROFESSIONAL; // 78%
    }

    private TaxEstimate computeItalyOrdinario(BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = maxZero(grossIncome.subtract(businessExpenses));
        BigDecimal inps = profit.multiply(IT_INPS_RATE);
        BigDecimal taxable = maxZero(profit.subtract(inps));
        BigDecimal incomeTax = computeItalyIrpef(taxable);
        // VAT: 22% on net (gross - expenses)
        BigDecimal vatToPay = maxZero(grossIncome.subtract(businessExpenses).multiply(VAT_ITALY_RATE));
        return new TaxEstimate(money(taxable), money(incomeTax), money(inps), money(vatToPay));
    }

    private BigDecimal computeItalyIrpef(BigDecimal taxable) {
        if (taxable.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal tax = BigDecimal.ZERO;
        if (taxable.compareTo(IT_IRPEF_B1_LIMIT) <= 0) {
            return taxable.multiply(new BigDecimal("0.23"));
        }
        tax = IT_IRPEF_B1_LIMIT.multiply(new BigDecimal("0.23"));
        if (taxable.compareTo(IT_IRPEF_B2_LIMIT) <= 0) {
            return tax.add(taxable.subtract(IT_IRPEF_B1_LIMIT).multiply(new BigDecimal("0.35")));
        }
        tax = tax.add(IT_IRPEF_B2_LIMIT.subtract(IT_IRPEF_B1_LIMIT).multiply(new BigDecimal("0.35")));
        return tax.add(taxable.subtract(IT_IRPEF_B2_LIMIT).multiply(new BigDecimal("0.43")));
    }

    // Fallback: country not recognized → flat estimate based on profit
    private TaxEstimate computeFallbackTax(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = maxZero(grossIncome.subtract(businessExpenses));
        BigDecimal incomeTax = profit.multiply(new BigDecimal("0.3697"));
        BigDecimal vatToPay = isVatExempt(user) ? BigDecimal.ZERO
                : maxZero(grossIncome.subtract(businessExpenses).multiply(VAT_FALLBACK_RATE));
        return new TaxEstimate(money(profit), money(incomeTax), BigDecimal.ZERO, money(vatToPay));
    }

    private String escapeIcsText(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace(",", "\\,")
                .replace(";", "\\;")
                .replace("\n", "\\n");
    }
}
