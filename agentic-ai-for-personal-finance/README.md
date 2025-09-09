# Agentic AI for Personal Finance

## 1. Introduction

Managing money is hard. People know they should save and spend smarter, but discipline and real-time guidance are missing. Most tools are passive trackers. They inform, but they don’t act.

We explore a Truly Agentic AI system - an AI that doesn’t just advise but takes action on behalf of the user, safely and transparently. This case study documents our research: options explored, concepts encountered, trade-offs discovered. The goal is not to fix a design but to build a reference landscape for future decisions.

---

## 2. Problem Statement

Most people struggle with personal finance. They often react to financial events instead of proactively planning. This leads to missed savings, unnecessary debt, and financial stress.

Key challenges:

- Discipline gap: Knowing what to do vs. doing it.
- Real-time context: Users lack timely nudges or automated actions.
- Privacy and trust: Financial data is sensitive; any solution must minimize exposure.

---

## 3. Conceptual Solution

An AI agent with agency to act within defined guardrails.

- Savings Agent: On detecting a bonus, auto-transfer a portion into savings.
- Subscription Agent: Identify unused subscriptions, cancel them, report savings.
- Debt Reduction Agent: Calculate optimal repayment across debts and initiate payments.

**The goal:** effortless financial wellness powered by automation, with privacy-first guarantees.

---

## 4. Research

### 4.1 Data Collection

Manual entry is unrealistic. The system must connect to live data sources.

#### A: Financial Data Aggregation APIs

- **What it is:** Secure, regulated services that link to banks/credit cards/financial institutions with user consent. Provide structured access to balances, transactions, investments.
- **How it works:** Instead of the user giving you their login credentials (a major security no-no), they are securely redirected to their bank's website or app, where they grant permission to the API service. The API then provides your application with a token that allows read-only access to their data. Most providers also offer a sandbox with test accounts for safe development and testing.
- **Pros:** Secure, standardized, compliant.
- **Cons:** Dependency on third-party providers, possible vendor lock-in.
- **Feasibility:** High — sustainable long-term strategy.

#### B: SMS Parsing

- **What it is:** Reading bank transaction alerts via SMS (possible on Android).
- **How it works:** Regex or ML-based parsers extract merchant, amount, timestamp.
- **Risks:**
  - Privacy & Trust: Reading SMS requires enormous trust, as inboxes contain personal chats, OTPs, and other sensitive data.
  - Informed Consent: Users must give explicit, transparent consent; permissions must clearly state SMS access.
  - Data Security: Accessing SMS means securing vast amounts of potentially sensitive, non-financial data as well; breaches would be catastrophic.
  - Regulatory Compliance: Likely violates GDPR/CCPA, which require collecting only essential data; SMS access gathers far more than needed.
  - Platform Restrictions: Apple's sandboxed environment makes it virtually impossible for an app to read SMS messages unless it's a core system app. On Android, while it's technically possible, apps that request this permission are often flagged for security review, and it is a major red flag for users.
- **Feasibility:** Low — may work for demos, but not viable long-term.

**Comparison Table:**

| Method            | Privacy                                      | Latency               | Complexity | Feasibility       | Example / User Benefit                                                      |
| ----------------- | -------------------------------------------- | --------------------- | ---------- | ----------------- | --------------------------------------------------------------------------- |
| **Financial API** | Medium — third-party handles credentials     | Low                   | Low        | High              | Access structured transactions, balances, investments                       |
| **SMS Parsing**   | Low — access to full inbox                   | Low                   | Medium     | Low               | Extract transaction info from messages (demo only)                          |


**Decision insight:** APIs are the sustainable path. SMS is not compliant or user-friendly.

---

### 4.2 Data Processing Approaches

#### A. Server-Side Processing

Servers handle heavy computation and enable cross-user learning but come with privacy risks. Using third-party AI APIs (e.g., OpenAI, Perplexity) can accelerate development by analyzing structured financial data; however, they also increase the risk of data exposure since sensitive information leaves your controlled environment.

**Key Challenge**: How to process sensitive financial data securely.

**Solution**:

- **Fully Homomorphic Encryption (FHE):**

  - **What it is:** It is a form of encryption that allows you to perform computations directly on the encrypted data. You can add or multiply two encrypted numbers, and the result, when decrypted, is the same as if you had done the operation on the original, unencrypted numbers.
  - **How it works:** App encrypts SMS data (public key) → Encrypted data sent to server → Server AI analyzes without decryption → Encrypted result returned → App decrypts with private key (stays on device).
  - **Pros:** Maximum privacy.
  - **Cons:** Extremely slow and compute-heavy.
  - **Feasibility:** Low for real-time, but worth monitoring as field matures.

- **Secure Multiparty Computation (SMPC):**

  - **What it is:** A cryptographic technique where private data is split into random “shares” and distributed across multiple servers. No single server can see the full data, but together they can compute a result. This allows collaborative computation without exposing the underlying inputs.  
  - **How it works:** App splits SMS/transaction data into shares → Shares sent to multiple servers → Each server computes only on its share → Partial results combined → Final output returned without ever reconstructing the raw data.  
  - **Pros:** Strong security in multi-party settings.
  - **Cons:** High communication cost, complex setup.
  - **Feasibility:** Low-Medium — niche use cases.

- **Federated Learning (FL):**

  - **What it is:** A distributed machine learning approach where the model is trained locally on users’ devices using their private data. Only model updates (gradients or weight changes) are sent to the server, never the raw data, preserving user privacy while improving a central model.  
  - **How it works:** Central model sent to device → Model trains locally on SMS/transaction data → Device sends model updates to server → Server aggregates updates from many users → Central model improves without ever accessing raw data → User benefits from personalized, more accurate categorization and recommendations
  - **Pros:** Practical, already deployed in industry (Google Gboard, Apple).
  - **Cons:** Requires many active devices, privacy risks unless combined with Differential Privacy.
  - **Feasibility:** Medium-High — strong candidate for scalable privacy-preserving learning.

---

#### B. Client-Side Processing

Running AI models directly on-device offers strong privacy and low latency, since no data leaves the user’s phone, but it is limited by device hardware. The solution is to package the UI, model, and inference engine into a compact app (around 100 MB), making it lightweight enough for broad smartphone compatibility while still delivering useful performance.

**Key Challenge:** How to deliver efficient, high-quality AI within strict size and hardware constraints.

**Solution:**

- **Model Quantization and Pruning:**
  
  This is the most critical step to address app size and performance.

  - **Quantization:** This process reduces the precision of the numbers (weights) used in the model. (e.g., 32-bit → 4,8-bit integers) that cuts size by up to 4-8x, speeding inference.

  - **Pruning:** This technique removes redundant or less important connections (neurons) from the neural network that can make the model smaller without a significant drop in performance.

  - **Knowledge Distillation:** Train a smaller "student" model to mimic the behavior of a larger, more powerful "teacher" model that allows you to transfer the knowledge from a huge model to a tiny one, reducing footprint. (e.g., several GBs → a few hundred MB or less)

- **Using Specialized, Lightweight Models:**
  
  You don't need a general-purpose LLM to perform your specific tasks. The community has developed models specifically for on-device use.

  - **Small Language Models (SLMs):** These are models specifically trained to be small and efficient. e.g., Gemma, Phi, and TinyLlama families. These models have a few hundred million to a few billion parameters, which is a manageable size for a modern smartphone.

  - **Fine-tuning:** Instead of running a general-purpose SLM, you can fine-tune it on a small, specific dataset of financial text (which you can generate or find from open-source repositories). This makes the model extremely good at your specific task (e.g., categorizing transactions, generating financial summaries) while keeping it small.

- **Leveraging On-Device Hardware and Inference Engines:**

  Modern smartphones are not just CPUs; they are equipped with specialized chips for AI tasks.

  - **Neural Processing Units (NPUs):** Most modern smartphones (from companies like Qualcomm and Google) have dedicated NPUs. These are hardware accelerators designed for machine learning inference, and they are incredibly efficient at running quantized models.

  - **Inference Engines:** You can't just run a model file on a device. You need a runtime inference engine. Libraries like TensorFlow Lite, PyTorch Mobile, or MediaPipe are specifically designed to deploy and run optimized models on mobile devices, taking advantage of NPUs where available.

  - **llama.cpp:** This is an excellent open-source project that allows you to run quantized LLMs on a wide range of hardware, including mobile phones, using just the CPU.

**Hardware Requirements:** The goal is to target the widest possible range of modern devices, not just the latest flagships.

- **Minimum viable demo:** 4 GB RAM, mid-range CPU, Android 10+. Response in seconds.
- **Recommended UX:** 6–8 GB RAM, NPU/GPU, Android 12+. Near-instant inference.

**Comparison Table:**

| Method            | Privacy                                      | Latency               | Complexity | Feasibility       | Example / User Benefit                                                      |
| ----------------- | -------------------------------------------- | --------------------- | ---------- | ----------------- | --------------------------------------------------------------------------- |
| **FHE**           | Maximum — server never sees raw data         | High (slow)           | Very high  | Low for real-time | Compute spending analysis on encrypted transactions                         |
| **SMPC**          | High — data split into shares across servers | Medium                | High       | Low-Medium        | Transaction totals computed via shares without revealing full data          |
| **FL**            | High — raw data stays local                  | Low (local inference) | Medium     | Medium-High       | Personalized categorization & recommendations on device                     |
| **On-device LLM** | High — data stays local                      | Low                   | Medium     | Medium-High       | Classify transactions, summarize finances, run AI agents directly on device |


**Decision insight:** Modern devices make on-device inference feasible if optimized properly.

---

## 5. Open Questions

- Where should long-term memory reside — client, server, or hybrid?
- What is the minimum model accuracy for financial categorization to be user-trustworthy?
- Can lightweight on-device models outperform API-based categorization?
- How to balance automation vs. user control to maintain trust?

---

## 6. Conclusion

- Aggregation APIs + On-device models form the most viable foundation.
- SMS parsing is not sustainable beyond demos.
- FHE and SMPC are academically promising but not production-ready.
- FL offers a practical middle ground for collaborative learning.

This research provides a structured landscape of options and trade-offs. The next step is to design an architecture that blends API-based collection, on-device reasoning, and selective server-side learning under strict privacy guarantees.

---