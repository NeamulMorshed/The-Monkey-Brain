---
title: "RAG (Retrieval-Augmented Generation)"
type: concept
status: active
tags: [methodology, retrieval, contrast]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[llm-wiki-pattern]]", "[[search-tooling]]"]
aliases: ["retrieval augmented generation"]
---

# RAG (Retrieval-Augmented Generation)

The conventional pattern The Monkey Brain is defined *against*: upload files, the LLM
retrieves relevant chunks at query time and generates an answer. NotebookLM, ChatGPT file
uploads, and most "chat with your docs" systems work this way.

## The limitation
The LLM **rediscovers knowledge from scratch on every question**. Nothing accumulates. A
subtle question needing five documents synthesized forces the model to find and re-piece
the fragments every single time. No cross-references, no flagged contradictions, no
standing synthesis.

## Contrast
The [[llm-wiki-pattern]] inverts this: build a persistent, compounding artifact once and
maintain it, so synthesis is *already done* before the query arrives. Note RAG isn't
useless — embedding/[[search-tooling|hybrid search]] becomes the recommended **upgrade path**
once a wiki outgrows its [[index-and-log|index file]].

## Sources
- [[llm-wiki]]
