package com.opex.backend.user.controller;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.dto.EmailVerificationStatusResponse;
import com.opex.backend.user.dto.UserPrimarySecondFactorRequest;
import com.opex.backend.user.dto.UserSecurityStatusResponse;
import com.opex.backend.user.dto.UserResponse;
import com.opex.backend.user.dto.UserUpdateRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/sync")
    public ResponseEntity<UserResponse> syncUser(AuthenticatedUser authenticatedUser) {
        User user = userService.syncUserWithKeycloak(authenticatedUser);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @GetMapping("/security")
    public ResponseEntity<UserSecurityStatusResponse> getSecurityStatus(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(userService.getSecurityStatus(authenticatedUser));
    }

    @PatchMapping("/security/primary-method")
    public ResponseEntity<UserSecurityStatusResponse> setPrimarySecondFactor(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody UserPrimarySecondFactorRequest request
    ) {
        return ResponseEntity.ok(userService.setPrimarySecondFactor(authenticatedUser, request));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        User updatedUser = userService.updateAdditionalData(authenticatedUser.userId(), request);
        return ResponseEntity.ok(UserResponse.from(updatedUser));
    }

    @PostMapping("/profile/send-verification-email")
    public ResponseEntity<EmailVerificationStatusResponse> sendVerificationEmail(AuthenticatedUser authenticatedUser) {
        EmailVerificationStatusResponse response = userService.sendVerificationEmail(authenticatedUser.userId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteMyAccount(AuthenticatedUser authenticatedUser) {
        userService.deleteUser(authenticatedUser.userId());
        return ResponseEntity.noContent().build();
    }
}
