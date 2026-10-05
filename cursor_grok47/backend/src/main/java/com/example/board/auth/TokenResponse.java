package com.example.board.auth;

public record TokenResponse(String accessToken, String tokenType, String username) {
}
