package com.opex.backend.repository;

import com.opex.backend.model.Tax;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxRepository extends JpaRepository<Tax, String> {

    List<Tax> findByUserId(String userId);

    // Lista paginata di tutte le tasse dell'utente (esterne e locali mischiate)
    Page<Tax> findByUserId(String userId, Pageable pageable);

    // Trova una specifica tassa assicurandoci che sia dell'utente che fa la richiesta
    Optional<Tax> findByIdAndUserId(String id, String userId);

    // Lista completa ordinata per scadenza (utile per dashboard Tax Buffer)
    List<Tax> findByUserIdOrderByDeadlineAsc(String userId);
}
