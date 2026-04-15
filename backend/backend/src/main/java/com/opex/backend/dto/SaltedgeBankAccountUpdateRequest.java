package com.opex.backend.dto;

import lombok.Data;

@Data
public class SaltedgeBankAccountUpdateRequest {
    private String institutionName;
    private Boolean isForTax;
    private String nature;
}
