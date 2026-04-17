package com.opex.backend.notification.service;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationTriggerService {

    private static final BigDecimal SIGNIFICANT_INCOME_THRESHOLD = new BigDecimal("100");
    private static final BigDecimal ABNORMAL_OUTFLOW_THRESHOLD = new BigDecimal("500");
    private static final int CONSENT_EXPIRY_DAYS = 90;

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final TaxRepository taxRepository;

    /**
     * Call this after any transaction is saved (local or imported).
     * Checks: significant income, abnormal outflow, critical balance.
     */
    public void onTransactionCreated(String userId, BigDecimal signedAmount) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        boolean isIncome = signedAmount != null && signedAmount.compareTo(BigDecimal.ZERO) > 0;
        BigDecimal absAmount = signedAmount != null ? signedAmount.abs() : BigDecimal.ZERO;

        if (isIncome && Boolean.TRUE.equals(user.getNotifySignificantIncome())) {
            if (absAmount.compareTo(SIGNIFICANT_INCOME_THRESHOLD) > 0) {
                notificationService.createNotification(
                        user,
                        "success",
                        "Significant Income Received",
                        String.format("You received a transfer of €%.2f.", absAmount),
                        "TrendingUp"
                );
            }
        }

        if (!isIncome && Boolean.TRUE.equals(user.getNotifyAbnormalOutflow())) {
            if (absAmount.compareTo(ABNORMAL_OUTFLOW_THRESHOLD) > 0) {
                notificationService.createNotification(
                        user,
                        "warning",
                        "Abnormal Outflow Detected",
                        String.format("A large expense of €%.2f was recorded. Verify it is expected.", absAmount),
                        "AlertTriangle"
                );
            }
        }

        if (Boolean.TRUE.equals(user.getNotifyCriticalBalance())) {
            BigDecimal totalBalance = bankAccountRepository.findByUserId(userId).stream()
                    .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double threshold = user.getNotificationBalanceThreshold() != null
                    ? user.getNotificationBalanceThreshold()
                    : 500.0;

            if (totalBalance.compareTo(BigDecimal.valueOf(threshold)) < 0) {
                notificationService.createNotification(
                        user,
                        "danger",
                        "Critical Balance Alert",
                        String.format("Your total balance (€%.2f) dropped below your threshold of €%.2f.",
                                totalBalance, threshold),
                        "AlertCircle"
                );
            }
        }
    }

    /**
     * Call this when a bank sync or connection refresh fails.
     */
    public void onSyncError(String userId, String providerName) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getNotifySyncErrors())) return;

        String provider = (providerName != null && !providerName.isBlank()) ? providerName : "your bank";
        notificationService.createNotification(
                user,
                "danger",
                "Bank Sync Error",
                String.format("Unable to sync data from %s. Please reconnect your account.", provider),
                "WifiOff"
        );
    }

    /**
     * Scheduled daily at 09:00 — warns users whose Open Banking consent is
     * expiring in exactly 7 or 2 days (EU PSD2 90-day window).
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkConsentExpirations() {
        LocalDate today = LocalDate.now();
        LocalDate in7 = today.plusDays(7);
        LocalDate in2 = today.plusDays(2);

        for (BankConnection connection : bankConnectionRepository.findAll()) {
            if (connection.getCreatedAt() == null) continue;
            if (!"active".equalsIgnoreCase(connection.getStatus())) continue;

            LocalDate expiryDate = connection.getCreatedAt().plusDays(CONSENT_EXPIRY_DAYS);

            User user = userRepository.findById(connection.getUserId()).orElse(null);
            if (user == null || !Boolean.TRUE.equals(user.getNotifyConsentExpiration())) continue;

            if (expiryDate.isEqual(in7)) {
                notificationService.createNotification(
                        user,
                        "warning",
                        "Bank Consent Expiring Soon",
                        "Your Open Banking consent for " + connection.getProviderName()
                                + " expires in 7 days. Reconnect to keep your data in sync.",
                        "Clock"
                );
            } else if (expiryDate.isEqual(in2)) {
                notificationService.createNotification(
                        user,
                        "danger",
                        "Bank Consent Expiring in 2 Days",
                        "Your Open Banking consent for " + connection.getProviderName()
                                + " expires in 2 days. Reconnect now to avoid interruption.",
                        "AlertCircle"
                );
            }
        }
    }

    /**
     * Scheduled daily at 08:00 — warns users whose tax deadlines are 10 days away.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkVatDeadlines() {
        LocalDate targetDate = LocalDate.now().plusDays(10);
        List<Tax> taxesDue = taxRepository.findByDeadlineAndStatus(targetDate, "PENDING");

        for (Tax tax : taxesDue) {
            User user = userRepository.findById(tax.getUserId()).orElse(null);
            if (user == null || !Boolean.TRUE.equals(user.getNotifyQuarterlyVat())) continue;

            notificationService.createNotification(
                    user,
                    "warning",
                    "Tax Deadline in 10 Days",
                    String.format("%s is due on %s. Estimated amount: €%.2f.",
                            tax.getName(), tax.getDeadline(), tax.getAmount()),
                    "Calendar"
            );
        }
    }

    /**
     * Scheduled on the 1st of each month at 07:00 — sends monthly analysis summary.
     */
    @Scheduled(cron = "0 0 7 1 * *")
    public void generateMonthlyAnalysis() {
        for (User user : userRepository.findAll()) {
            if (!Boolean.TRUE.equals(user.getNotifyMonthlyAnalysis())) continue;

            notificationService.createNotification(
                    user,
                    "info",
                    "Monthly Financial Report Ready",
                    "Your financial summary for last month is available. Open Insights for a detailed breakdown.",
                    "BarChart2"
            );
        }
    }
}
