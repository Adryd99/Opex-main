package com.opex.backend.banking.dto;

import lombok.Data;

@Data
public class SaltedgeBankAccountUpdateRequest {
    private String institutionName;
    private Boolean isForTax;
    private String nature;
}
