package com.opex.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionRequest {
    private String bankAccountId; // Obbligatorio per la POST locale, opzionale per la PATCH
    private String connectionId; // Legacy: non necessario per le transazioni locali
    private BigDecimal amount;
    private LocalDate bookingDate;
    private String category;
    private String description;
    private String merchantName;
    private String status;
    private String type;
}
