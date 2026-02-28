package com.example.game.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 修正前端可能发出的双重 /api 前缀请求，
 * 将 /api/api/... 重写为 /api/...
 */
@Configuration
public class UrlRewriteFilter {

    @Bean
    public FilterRegistrationBean<Filter> urlRewriteFilterRegistration() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {

                String requestUri = request.getRequestURI();

                if (requestUri.startsWith("/api/api/")) {
                    String rewrittenUri = requestUri.replaceFirst("/api/api/", "/api/");
                    HttpServletRequest wrappedRequest = new HttpServletRequestWrapper(request) {
                        @Override
                        public String getRequestURI() {
                            return rewrittenUri;
                        }

                        @Override
                        public String getServletPath() {
                            return rewrittenUri;
                        }
                    };
                    filterChain.doFilter(wrappedRequest, response);
                    return;
                }

                filterChain.doFilter(request, response);
            }
        });
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
        registration.addUrlPatterns("/*");
        return registration;
    }
}
