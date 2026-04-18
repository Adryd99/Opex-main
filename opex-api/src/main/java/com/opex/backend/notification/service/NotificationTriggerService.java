package com.opex.backend.notification.service;

import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationTriggerService {

    private static final BigDecimal SIGNIFICANT_INCOME_THRESHOLD = new BigDecimal("100");
    private static final BigDecimal ABNORMAL_OUTFLOW_THRESHOLD = new BigDecimal("500");
    private static final double DEFAULT_BALANCE_THRESHOLD = 500.0;

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;

    public void onTransactionCreated(String userId, BigDecimal signedAmount) {
        User user = findUser(userId).orElse(null);
        if (user == null) {
            return;
        }

        boolean isIncome = signedAmount != null && signedAmount.compareTo(BigDecimal.ZERO) > 0;
        BigDecimal absoluteAmount = signedAmount != null ? signedAmount.abs() : BigDecimal.ZERO;

        if (isIncome && Boolean.TRUE.equals(user.getNotifySignificantIncome())
                && absoluteAmount.compareTo(SIGNIFICANT_INCOME_THRESHOLD) > 0) {
            notificationService.createNotification(
                    user,
                    "success",
                    "Significant Income Received",
                    String.format("You received a transfer of EUR %.2f.", absoluteAmount),
                    "TrendingUp"
            );
        }

        if (!isIncome && Boolean.TRUE.equals(user.getNotifyAbnormalOutflow())
                && absoluteAmount.compareTo(ABNORMAL_OUTFLOW_THRESHOLD) > 0) {
            notificationService.createNotification(
                    user,
                    "warning",
                    "Abnormal Outflow Detected",
                    String.format("A large expense of EUR %.2f was recorded. Verify it is expected.", absoluteAmount),
                    "AlertTriangle"
            );
        }

        if (Boolean.TRUE.equals(user.getNotifyCriticalBalance())) {
            BigDecimal totalBalance = bankAccountRepository.findByUserId(userId).stream()
                    .map(account -> account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double threshold = user.getNotificationBalanceThreshold() != null
                    ? user.getNotificationBalanceThreshold()
                    : DEFAULT_BALANCE_THRESHOLD;

            if (totalBalance.compareTo(BigDecimal.valueOf(threshold)) < 0) {
                notificationService.createNotification(
                        user,
                        "danger",
                        "Critical Balance Alert",
                        String.format(
                                "Your total balance (EUR %.2f) dropped below your threshold of EUR %.2f.",
                                totalBalance,
                                threshold
                        ),
                        "AlertCircle"
                );
            }
        }
    }

    public void onSyncError(String userId, String providerName) {
        User user = findUser(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getNotifySyncErrors())) {
            return;
        }

        String provider = (providerName != null && !providerName.isBlank()) ? providerName : "your bank";
        notificationService.createNotification(
                user,
                "danger",
                "Bank Sync Error",
                String.format("Unable to sync data from %s. Please reconnect your account.", provider),
                "WifiOff"
        );
    }

    private Optional<User> findUser(String userId) {
        return userRepository.findById(userId);
    }
}
