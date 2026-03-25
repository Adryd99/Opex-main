package com.opex.backend.service;

import com.opex.backend.dto.TaxBufferDashboardResponse;
import com.opex.backend.dto.TaxRequest;
import com.opex.backend.model.BankConnection;
import com.opex.backend.model.Tax;
import com.opex.backend.model.Transaction;
import com.opex.backend.repository.BankAccountRepository;
import com.opex.backend.repository.BankConnectionRepository;
import com.opex.backend.repository.TaxRepository;
import com.opex.backend.repository.TransactionRepository;
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
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TaxService {

    private static final BigDecimal VAT_FALLBACK_RATE = new BigDecimal("0.21");
    private static final BigDecimal INCOME_TAX_FALLBACK_RATE = new BigDecimal("0.3693");
    private static final BigDecimal SOCIAL_FALLBACK_RATE = new BigDecimal("0.0532");
    private static final int MONEY_SCALE = 2;
    private static final String DEFAULT_CURRENCY = "EUR";

    private final BankAccountRepository bankAccountRepository;
    private final TaxRepository taxRepository;
    private final TransactionRepository transactionRepository;
    private final BankConnectionRepository bankConnectionRepository;

    // --- 1. LEGGE TUTTE LE TASSE (PAGINATO) ---
    public Page<Tax> getUserTaxes(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return taxRepository.findByUserId(userId, pageable);
    }

    // --- DASHBOARD TAX BUFFER (SUMMARY + BREAKDOWN + DEADLINES + ACTIVITY) ---
    public TaxBufferDashboardResponse getTaxBufferDashboard(String userId, String connectionId, Integer year, int deadlinesLimit, int activityLimit) {
        int targetYear = resolveYear(year);
        validateConnectionOwnership(userId, connectionId);

        List<Transaction> transactions = getTransactionsForScope(userId, connectionId);
        List<Transaction> yearlyTransactions = filterTransactionsByYear(transactions, targetYear);
        List<Tax> yearlyTaxes = getTaxesForYear(userId, targetYear);

        BigDecimal taxableIncome = money(sumPositiveAmounts(yearlyTransactions));
        BigDecimal incomeTax = money(resolveIncomeTax(yearlyTaxes, taxableIncome));
        BigDecimal socialContributions = money(resolveSocialContributions(yearlyTaxes, taxableIncome));
        BigDecimal vatLiability = money(resolveVatLiability(yearlyTaxes, taxableIncome));
        BigDecimal subtotal = money(incomeTax.add(socialContributions));
        BigDecimal shouldSetAside = money(subtotal.add(vatLiability));
        BigDecimal alreadySaved = money(resolveAlreadySaved(userId, connectionId));
        BigDecimal missing = money(maxZero(shouldSetAside.subtract(alreadySaved)));
        BigDecimal completionPercentage = percentage(alreadySaved, shouldSetAside);
        BigDecimal weeklyTarget = money(computeWeeklyTarget(missing, targetYear));

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
                LocalDate.of(targetYear, 12, 31)
        );

        TaxBufferDashboardResponse.IncomeSocialBreakdown incomeSocial = new TaxBufferDashboardResponse.IncomeSocialBreakdown(
                taxableIncome,
                incomeTax,
                socialContributions,
                subtotal
        );

        TaxBufferDashboardResponse.VatBreakdown vat = new TaxBufferDashboardResponse.VatBreakdown(
                "Standard VAT",
                VAT_FALLBACK_RATE.multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP),
                vatLiability
        );

        List<TaxBufferDashboardResponse.LiabilityItem> liabilitySplit = List.of(
                toLiabilityItem("VAT (21%)", vatLiability, shouldSetAside),
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

    public List<TaxBufferDashboardResponse.TaxDeadlineItem> getTaxDeadlines(String userId, Integer year, int limit) {
        int targetYear = resolveYear(year);
        int safeLimit = Math.max(1, limit);

        return taxRepository.findByUserIdOrderByDeadlineAsc(userId).stream()
                .filter(tax -> tax.getDeadline() != null)
                .filter(tax -> tax.getDeadline().getYear() == targetYear)
                .limit(safeLimit)
                .map(this::toDeadlineItem)
                .collect(Collectors.toList());
    }

    public List<TaxBufferDashboardResponse.BufferActivityItem> getBufferActivity(String userId, String connectionId, Integer year, int limit) {
        int targetYear = resolveYear(year);
        int safeLimit = Math.max(1, limit);
        validateConnectionOwnership(userId, connectionId);

        List<Transaction> yearlyTransactions = filterTransactionsByYear(getTransactionsForScope(userId, connectionId), targetYear);
        List<Tax> yearlyTaxes = getTaxesForYear(userId, targetYear);

        List<TaxBufferDashboardResponse.BufferActivityItem> transactionEvents = yearlyTransactions.stream()
                .filter(t -> t.getBookingDate() != null)
                .map(this::toTransactionActivityItem)
                .collect(Collectors.toList());

        List<TaxBufferDashboardResponse.BufferActivityItem> paidTaxEvents = yearlyTaxes.stream()
                .filter(tax -> isPaidStatus(tax.getStatus()))
                .filter(tax -> tax.getDeadline() != null)
                .map(this::toPaidTaxActivityItem)
                .collect(Collectors.toList());

        return Stream.concat(transactionEvents.stream(), paidTaxEvents.stream())
                .sorted(Comparator.comparing(TaxBufferDashboardResponse.BufferActivityItem::getDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(safeLimit)
                .collect(Collectors.toList());
    }

    public List<TaxBufferDashboardResponse.ProviderItem> getAvailableProviders(String userId) {
        return bankConnectionRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(BankConnection::getProviderName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(connection -> new TaxBufferDashboardResponse.ProviderItem(
                        connection.getId(),
                        connection.getProviderName(),
                        connection.getStatus()
                ))
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
            String dateValue = item.getDueDate().format(DateTimeFormatter.BASIC_ISO_DATE);
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:").append(escapeIcsText(item.getId() + "@opex")).append("\r\n");
            sb.append("DTSTAMP:").append(nowUtc).append("\r\n");
            sb.append("DTSTART;VALUE=DATE:").append(dateValue).append("\r\n");
            sb.append("SUMMARY:").append(escapeIcsText(item.getTitle())).append("\r\n");
            sb.append("DESCRIPTION:").append(escapeIcsText("Tax deadline - status: " + item.getStatus())).append("\r\n");
            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    // --- 2. CREA UNA TASSA LOCALE (MANUALE) ---
    @Transactional
    public Tax createLocalTax(String userId, TaxRequest request) {
        Tax tax = new Tax();
        // Generiamo un ID fittizio per le tasse manuali
        tax.setId("tax_local_" + UUID.randomUUID().toString());
        tax.setUserId(userId);

        // La stiamo creando a mano, quindi non è esterna!
        tax.setIsExternal(false);

        tax.setDeadline(request.getDeadline());
        tax.setName(request.getName());
        tax.setStatus(request.getStatus());
        tax.setAmount(request.getAmount());
        tax.setCurrency(request.getCurrency());

        return taxRepository.save(tax);
    }

    // --- 3. AGGIORNA UNA TASSA LOCALE ---
    @Transactional
    public Tax updateLocalTax(String userId, String taxId, TaxRequest request) {
        // Cerco la tassa e mi assicuro che appartenga all'utente
        Tax tax = taxRepository.findByIdAndUserId(taxId, userId)
                .orElseThrow(() -> new RuntimeException("Tassa non trovata o non autorizzata"));

        // Protezione contro le modifiche illecite!
        if (Boolean.TRUE.equals(tax.getIsExternal())) {
            throw new RuntimeException("Impossibile modificare una scadenza fiscale generata da un servizio esterno.");
        }

        // Logica PATCH: Aggiorno solo i campi inviati
        if (request.getDeadline() != null) tax.setDeadline(request.getDeadline());
        if (request.getName() != null) tax.setName(request.getName());
        if (request.getStatus() != null) tax.setStatus(request.getStatus());
        if (request.getAmount() != null) tax.setAmount(request.getAmount());
        if (request.getCurrency() != null) tax.setCurrency(request.getCurrency());

        return taxRepository.save(tax);
    }

    // --- 4. CANCELLA UNA TASSA LOCALE ---
    @Transactional
    public void deleteLocalTax(String userId, String taxId) {
        // Cerco la tassa e mi assicuro che appartenga all'utente
        Tax tax = taxRepository.findByIdAndUserId(taxId, userId)
                .orElseThrow(() -> new RuntimeException("Tassa non trovata o non autorizzata"));

        // Protezione contro le cancellazioni illecite!
        if (Boolean.TRUE.equals(tax.getIsExternal())) {
            throw new RuntimeException("Impossibile cancellare una scadenza fiscale generata da un servizio esterno.");
        }

        // Procedo con l'eliminazione
        taxRepository.delete(tax);
    }

    private int resolveYear(Integer year) {
        return year != null ? year : LocalDate.now().getYear();
    }

    private void validateConnectionOwnership(String userId, String connectionId) {
        if (isBlank(connectionId)) {
            return;
        }
        bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new RuntimeException("Connessione non trovata o non autorizzata"));
    }

    private List<Transaction> getTransactionsForScope(String userId, String connectionId) {
        if (isBlank(connectionId)) {
            return transactionRepository.findByUserId(userId);
        }
        return transactionRepository.findByUserIdAndConnectionId(userId, connectionId);
    }

    private List<Transaction> filterTransactionsByYear(List<Transaction> transactions, int year) {
        return transactions.stream()
                .filter(t -> t.getBookingDate() != null)
                .filter(t -> t.getBookingDate().getYear() == year)
                .collect(Collectors.toList());
    }

    private List<Tax> getTaxesForYear(String userId, int year) {
        return taxRepository.findByUserIdOrderByDeadlineAsc(userId).stream()
                .filter(tax -> tax.getDeadline() == null || tax.getDeadline().getYear() == year)
                .collect(Collectors.toList());
    }

    private BigDecimal sumPositiveAmounts(List<Transaction> transactions) {
        return transactions.stream()
                .map(Transaction::getAmount)
                .filter(amount -> amount != null && amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal resolveIncomeTax(List<Tax> taxes, BigDecimal taxableIncome) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("income", "irpef"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return taxableIncome.multiply(INCOME_TAX_FALLBACK_RATE);
    }

    private BigDecimal resolveSocialContributions(List<Tax> taxes, BigDecimal taxableIncome) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("social", "contribut", "inps"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return taxableIncome.multiply(SOCIAL_FALLBACK_RATE);
    }

    private BigDecimal resolveVatLiability(List<Tax> taxes, BigDecimal taxableIncome) {
        BigDecimal fromTaxes = sumTaxAmountsByKeywords(taxes, List.of("vat", "iva"));
        if (fromTaxes.compareTo(BigDecimal.ZERO) > 0) {
            return fromTaxes;
        }
        return taxableIncome.multiply(VAT_FALLBACK_RATE);
    }

    private BigDecimal resolveAlreadySaved(String userId, String connectionId) {
        String scopedConnectionId = isBlank(connectionId) ? null : connectionId;
        BigDecimal savingsBalance = bankAccountRepository.sumSavingsBalance(userId, scopedConnectionId);
        return maxZero(Optional.ofNullable(savingsBalance).orElse(BigDecimal.ZERO));
    }

    private BigDecimal sumTaxAmountsByKeywords(List<Tax> taxes, List<String> keywords) {
        return taxes.stream()
                .filter(tax -> tax.getAmount() != null)
                .filter(tax -> containsAnyKeyword(tax.getName(), keywords))
                .map(Tax::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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
        BigDecimal normalizedAmount = money(amount);
        BigDecimal percentage = percentage(normalizedAmount, total);
        return new TaxBufferDashboardResponse.LiabilityItem(label, normalizedAmount, percentage);
    }

    private TaxBufferDashboardResponse.TaxDeadlineItem toDeadlineItem(Tax tax) {
        return new TaxBufferDashboardResponse.TaxDeadlineItem(
                tax.getId(),
                Optional.ofNullable(tax.getName()).orElse("Tax Deadline"),
                tax.getDeadline(),
                resolveDeadlineStatus(tax),
                money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO)),
                Optional.ofNullable(tax.getCurrency()).orElse(DEFAULT_CURRENCY)
        );
    }

    private TaxBufferDashboardResponse.BufferActivityItem toTransactionActivityItem(Transaction transaction) {
        BigDecimal amount = money(Optional.ofNullable(transaction.getAmount()).orElse(BigDecimal.ZERO));
        String title = resolveActivityTitle(transaction);
        String direction = amount.compareTo(BigDecimal.ZERO) >= 0 ? "IN" : "OUT";
        return new TaxBufferDashboardResponse.BufferActivityItem(
                "txn_" + transaction.getId(),
                title,
                transaction.getBookingDate(),
                amount,
                direction
        );
    }

    private TaxBufferDashboardResponse.BufferActivityItem toPaidTaxActivityItem(Tax tax) {
        BigDecimal amount = money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO).negate());
        return new TaxBufferDashboardResponse.BufferActivityItem(
                "tax_" + tax.getId(),
                "Tax Payment: " + Optional.ofNullable(tax.getName()).orElse("Tax"),
                tax.getDeadline(),
                amount,
                "OUT"
        );
    }

    private String resolveActivityTitle(Transaction transaction) {
        String blob = (Optional.ofNullable(transaction.getCategory()).orElse("") + " " +
                Optional.ofNullable(transaction.getDescription()).orElse("")).toLowerCase(Locale.ROOT);

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

    private TaxBufferDashboardResponse.SafeMode buildSafeMode(BigDecimal missing,
                                                              List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines,
                                                              int year) {
        long overdue = deadlines.stream().filter(item -> "Overdue".equalsIgnoreCase(item.getStatus())).count();
        boolean compliant = overdue == 0 && missing.compareTo(BigDecimal.ZERO) == 0;

        if (compliant) {
            return new TaxBufferDashboardResponse.SafeMode(
                    true,
                    "Your buffer is aligned with estimated liabilities for " + year + ".",
                    "Keep current saving strategy."
            );
        }

        if (overdue > 0) {
            return new TaxBufferDashboardResponse.SafeMode(
                    false,
                    "You have overdue tax deadlines. Prioritize pending payments first.",
                    "Switch to conservative strategy until all overdue liabilities are settled."
            );
        }

        return new TaxBufferDashboardResponse.SafeMode(
                false,
                "Current buffer is below the estimated target.",
                "Increase weekly saves to close the gap before year end."
        );
    }

    private String resolveDeadlineStatus(Tax tax) {
        if (isPaidStatus(tax.getStatus())) {
            return "PAID".equalsIgnoreCase(tax.getStatus()) ? "Paid" : "Completed";
        }
        if (tax.getDeadline() != null && tax.getDeadline().isBefore(LocalDate.now())) {
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
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal raw = numerator
                .divide(denominator, 6, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
        if (raw.compareTo(new BigDecimal("100")) > 0) {
            raw = new BigDecimal("100");
        }
        return raw.setScale(2, RoundingMode.HALF_UP);
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

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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
