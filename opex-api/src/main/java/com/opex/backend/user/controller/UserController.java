package com.opex.backend.user.controller;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.dto.UserUpdateRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/sync")
    public ResponseEntity<User> syncUser(AuthenticatedUser authenticatedUser) {
        User user = userService.syncUserWithKeycloak(authenticatedUser);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/profile")
    public ResponseEntity<User> updateProfile(
            AuthenticatedUser authenticatedUser,
            @RequestBody UserUpdateRequest request
    ) {
        User updatedUser = userService.updateAdditionalData(authenticatedUser.userId(), request);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteMyAccount(AuthenticatedUser authenticatedUser) {
        userService.deleteUser(authenticatedUser.userId());
        return ResponseEntity.noContent().build();
    }
}
