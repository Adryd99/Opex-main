package com.opex.backend.notification.service;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationScheduleService {

    private static final int CONSENT_EXPIRY_DAYS = 90;

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final TaxRepository taxRepository;

    @Scheduled(cron = "0 0 9 * * *")
    public void checkConsentExpirations() {
        LocalDate today = LocalDate.now();
        LocalDate in7 = today.plusDays(7);
        LocalDate in2 = today.plusDays(2);

        for (BankConnection connection : bankConnectionRepository.findAll()) {
            if (connection.getType() != BankConnectionType.SALTEDGE
                    || connection.getCreatedAt() == null
                    || !"active".equalsIgnoreCase(connection.getStatus())) {
                continue;
            }

            LocalDate expiryDate = connection.getCreatedAt().plusDays(CONSENT_EXPIRY_DAYS);
            User user = findUser(connection.getUserId());
            if (user == null || !Boolean.TRUE.equals(user.getNotifyConsentExpiration())) {
                continue;
            }

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

    @Scheduled(cron = "0 0 8 * * *")
    public void checkVatDeadlines() {
        LocalDate targetDate = LocalDate.now().plusDays(10);
        List<Tax> taxesDue = taxRepository.findByDeadlineAndStatus(targetDate, "PENDING");

        for (Tax tax : taxesDue) {
            User user = findUser(tax.getUserId());
            if (user == null || !Boolean.TRUE.equals(user.getNotifyQuarterlyVat())) {
                continue;
            }

            notificationService.createNotification(
                    user,
                    "warning",
                    "Tax Deadline in 10 Days",
                    String.format("%s is due on %s. Estimated amount: EUR %.2f.",
                            tax.getName(), tax.getDeadline(), tax.getAmount()),
                    "Calendar"
            );
        }
    }

    @Scheduled(cron = "0 0 7 1 * *")
    public void generateMonthlyAnalysis() {
        for (User user : userRepository.findAll()) {
            if (!Boolean.TRUE.equals(user.getNotifyMonthlyAnalysis())) {
                continue;
            }

            notificationService.createNotification(
                    user,
                    "info",
                    "Monthly Financial Report Ready",
                    "Your financial summary for last month is available. Open Insights for a detailed breakdown.",
                    "BarChart2"
            );
        }
    }

    private User findUser(String userId) {
        return userRepository.findById(userId).orElse(null);
    }
}
