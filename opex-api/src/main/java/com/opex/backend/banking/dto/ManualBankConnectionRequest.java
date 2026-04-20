package com.opex.backend.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ManualBankConnectionRequest {

    @NotBlank
    private String providerName;
}
