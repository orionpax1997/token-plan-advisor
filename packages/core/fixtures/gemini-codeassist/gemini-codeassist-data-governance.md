# Data Governance for Gemini

> Source: https://docs.cloud.google.com/gemini/docs/discover/data-governance

## Overview

This document describes how Google Cloud processes and protects your data when using Gemini services, including Gemini Code Assist.

## Training

Gemini doesn't use your prompts or its responses as data to train its models.

## Stateless Design

Gemini Code Assist Standard and Enterprise are stateless Google Cloud services; they don't store prompts and responses. Conversations are not retained beyond the request lifecycle.

## Data Residency

For Gemini Code Assist, data is processed in the region nearest to the user (load-balanced globally). Enterprise customers can request data residency for specific regions.

## Encryption

All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Customer-managed encryption keys (CMEK) are available for Enterprise customers.

## Compliance

Gemini Code Assist complies with:

- SOC 1 / SOC 2 / SOC 3
- ISO/IEC 27001, 27017, 27018, 27701
- HIPAA (with BAA)
- GDPR

## Data Processing Addendum

Use of Gemini Code Assist is governed by the Cloud Data Processing Addendum, which is incorporated into the Google Cloud Terms of Service.
