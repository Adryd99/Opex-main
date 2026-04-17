package com.opex.backend.common.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

@Configuration(proxyBeanMethods = false)
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(Environment environment, LocalPropertyResolver localPropertyResolver) {
        String host = localPropertyResolver.resolve(environment, "localhost", "APP_PG_HOST");
        String port = localPropertyResolver.resolve(environment, "5433", "APP_PG_PORT");
        String database = localPropertyResolver.resolve(environment, "opexdb", "APP_PG_DB");

        String url = localPropertyResolver.resolve(
                environment,
                "jdbc:postgresql://" + host + ":" + port + "/" + database,
                "APP_PG_JDBC_URL",
                "spring.datasource.url"
        );
        String username = localPropertyResolver.resolve(
                environment,
                "opex",
                "APP_PG_USER",
                "spring.datasource.username"
        );
        String password = localPropertyResolver.resolve(
                environment,
                "opex",
                "APP_PG_PASSWORD",
                "spring.datasource.password"
        );

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setPoolName("backend-postgres");
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);

        log.info(
                "Configured PostgreSQL datasource for '{}' with user '{}' (password supplied: {})",
                url,
                username,
                !password.isBlank()
        );

        return dataSource;
    }
}
