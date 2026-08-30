/**
 * Database seed script for FeastedChat.
 *
 * Generates realistic, diverse, multi-turn AI conversations across varied technical
 * and creative domains with distinct model response styles (reasoning tags, code blocks,
 * markdown tables, blockquotes, architectural breakdowns, etc.).
 *
 * Usage:
 *   node scripts/seed-db.js
 *   MONGODB_URI=mongodb://127.0.0.1:27017/feastedchat \
 *   SEED_CONVERSATIONS=20 SEED_MIN_TURNS=12 SEED_MAX_MODELS=5 \
 *   node scripts/seed-db.js
 *
 *   SESSION_KEY=existing-key node scripts/seed-db.js   # seed into an existing session
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env or .env.local
function loadEnvFile(file) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile('.env');
loadEnvFile('.env.local');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/feastedchat';
const MAX_CONVERSATIONS = Math.min(50, parseInt(process.env.SEED_CONVERSATIONS || '50', 10) || 50);
const MIN_TURNS = Math.max(10, parseInt(process.env.SEED_MIN_TURNS || '10', 10) || 10);
const MAX_MODELS = Math.min(5, Math.max(2, parseInt(process.env.SEED_MAX_MODELS || '5', 10) || 5));
const PROVIDED_SESSION_KEY = process.env.SESSION_KEY || null;

const COLLECTIONS = {
  sessions: 'sessions',
  conversations: 'conversations',
  turns: 'turns',
  responses: 'responses',
  documents: 'documents',
};

// Mirror of lib/models.ts
const AVAILABLE_MODELS = [
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-sonnet-4',
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-sonnet-4-5',
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-opus-4',
  },
  {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-opus-4-1',
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-haiku-4-5',
  },
  {
    id: 'llama-4-scout-17b',
    name: 'Llama 4 Scout 17B',
    provider: 'Meta',
    gatewayId: 'meta/llama-4-scout-17b',
  },
  {
    id: 'llama-4-maverick-17b',
    name: 'Llama 4 Maverick 17B',
    provider: 'Meta',
    gatewayId: 'meta/llama-4-maverick-17b',
  },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', gatewayId: 'meta/llama-3.3-70b' },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    gatewayId: 'deepseek/deepseek-r1',
  },
  {
    id: 'nova-premier',
    name: 'Nova Premier',
    provider: 'Amazon',
    gatewayId: 'amazon/nova-premier',
  },
  { id: 'nova-pro', name: 'Nova Pro', provider: 'Amazon', gatewayId: 'amazon/nova-pro' },
  { id: 'nova-lite', name: 'Nova Lite', provider: 'Amazon', gatewayId: 'amazon/nova-lite' },
  { id: 'nova-micro', name: 'Nova Micro', provider: 'Amazon', gatewayId: 'amazon/nova-micro' },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    gatewayId: 'mistral/mistral-large',
  },
  {
    id: 'pixtral-large',
    name: 'Pixtral Large',
    provider: 'Mistral',
    gatewayId: 'mistral/pixtral-large-2502',
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    gatewayId: 'cohere/command-r-plus',
  },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', gatewayId: 'openai/gpt-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', gatewayId: 'openai/gpt-4o-mini' },
];

// ---------------------------------------------------------------------------
// 25 Rich Domain Topics with realistic multi-turn prompt flows & code context
// ---------------------------------------------------------------------------
const DOMAINS = [
  {
    id: 'nextjs-rsc',
    topic: 'Next.js 15 App Router & Server Actions Architecture',
    lang: 'typescript',
    prompts: [
      'How do I correctly structure Server Actions with optimistic UI updates in Next.js 15?',
      'Can you provide a code example for a custom hook using `useOptimistic` and `useTransition`?',
      'How should I handle server-side error validation and propagate errors back to the UI cleanly?',
      'What is the best way to handle revalidation using `revalidatePath` and `revalidateTag` without causing full page flashes?',
      'How do we secure these Server Actions against CSRF and unauthorized execution?',
      'Can you write unit tests for this Server Action using Vitest and Mock Service Worker?',
      'How do React Server Components interact with dynamic caching (`cacheUnstable` / `fetch` tags)?',
      'What are the performance trade-offs of using Server Actions versus traditional REST route handlers?',
      'Can you refactor this to support batch operations for multiple selected items?',
      'How should we monitor slow server action executions in Sentry or OpenTelemetry?',
      'Show me how to stream UI components using `<Suspense>` while data is fetched asynchronously.',
      'What is the recommended design pattern for sharing state between parent Server Components and child Client Components?',
      'How do we write a database fallback mechanism if the primary database query times out inside a RSC?',
      'Summarize the production readiness checklist for deploying this setup to Vercel/Docker.',
    ],
    sampleCode: `// actions/posts.ts
'use me';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const UpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(100),
  content: z.string().min(10)
});

export async function updatePostAction(prevState: any, formData: FormData) {
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  await db.post.update({ where: { id: parsed.data.id }, data: parsed.data });
  revalidateTag('posts-list');
  return { success: true, errors: {} };
}`,
  },

  {
    id: 'kafka-microservices',
    topic: 'Event-Driven Microservices Architecture with Apache Kafka',
    lang: 'go',
    prompts: [
      'We need to design a high-throughput event processing engine handling 50k events/sec using Kafka in Go. How should we partition topics?',
      'How do we guarantee exactly-once processing semantics across producer and consumer services?',
      'Can you show a Go consumer loop using `confluent-kafka-go` with graceful shutdown and offset committing?',
      'How should we handle poison pill messages and implement an automated Dead Letter Queue (DLQ) retry pattern?',
      'What strategies work best for schema evolution with Avro and Schema Registry?',
      'Can you draft an architecture diagram and explain how out-of-order events affect state reconciliation?',
      'How do we implement a distributed saga orchestrator using Kafka events for payment processing?',
      'Show how to set up Prometheus metrics for consumer lag monitoring and alert thresholds.',
      'What are the latency and memory trade-offs between batch size (`linger.ms`) vs instant delivery?',
      'Write a Kubernetes StatefulSet and HPA configuration to autoscale consumers based on lag.',
      'How do we trace an event end-to-end across 5 microservices using OpenTelemetry context propagation?',
      'What is the transactional outbox pattern and how does it prevent DB-Kafka inconsistency?',
      'Can you provide a Go implementation of the Transactional Outbox relay using Postgres Logical Replication?',
      'Summarize the key trade-offs between Kafka, RabbitMQ, and AWS SQS for this scale.',
    ],
    sampleCode: `// consumer.go
package main

import (
	"context"
	"fmt"
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

type EventConsumer struct {
	consumer *kafka.Consumer
	topic    string
}

function (c *EventConsumer) Start(ctx context.Context) error {
	c.consumer.SubscribeTopics([]string{c.topic}, nil)
	for {
		select {
		case <-ctx.Done():
			return c.consumer.Close()
		default:
			ev := c.consumer.Poll(100)
			if msg, ok := ev.(*kafka.Message); ok {
				processMessage(msg)
				c.consumer.CommitMessage(msg)
			}
		}
	}
}`,
  },

  {
    id: 'postgres-tuning',
    topic: 'PostgreSQL Query Optimization & Indexing Strategies at Scale',
    lang: 'sql',
    prompts: [
      'Our analytics query on a 60M row `orders` table takes 8 seconds. How do I analyze `EXPLAIN (ANALYZE, BUFFERS)` output?',
      'Should we use a B-Tree index, BRIN index, or GIN index for timestamp range queries on historical data?',
      'How do partial indexes and expression indexes improve query performance while keeping index maintenance cheap?',
      'Can you refactor this multi-table JOIN with nested subqueries into a CTE or window function?',
      'How does PostgreSQL table partitioning by month work, and how do we automate partition creation?',
      'What is the impact of `work_mem`, `random_page_cost`, and `effective_cache_size` on the query planner?',
      'How can PgBouncer connection pooling be configured to prevent connection starvation under spike loads?',
      'Write a Zero-Downtime database migration script for adding a NOT NULL column with a default value.',
      'How do we debug index bloat and set up automated autovacuum tuning per table?',
      'Show how to use Materialized Views with concurrent refresh strategies for real-time dashboards.',
      'What are the performance implications of UUID v4 primary keys versus TSID/ULID in Postgres B-Trees?',
      'How do we set up row-level security (RLS) policies without tanking query execution time?',
      'Can you provide a checklist for identifying locking issues (`pg_locks` and `pg_stat_activity`) under load?',
      'Provide a benchmark comparison table showing performance before and after optimization.',
    ],
    sampleCode: `-- Optimization example
CREATE INDEX CONCURRENTLY idx_orders_customer_created 
ON orders (customer_id, created_at DESC) 
INCLUDE (total_amount, status) 
WHERE status = 'completed';

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT customer_id, SUM(total_amount) AS lifetime_val
FROM orders
WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY customer_id
ORDER BY lifetime_val DESC
LIMIT 50;`,
  },

  {
    id: 'rag-vector-search',
    topic: 'Hybrid RAG Pipeline & Vector Search with Embeddings',
    lang: 'python',
    prompts: [
      'How do I build a Hybrid Search pipeline combining BM25 keyword search and Dense Vector retrieval in Python?',
      'What chunking strategy (semantic chunking vs sliding window) yields the best retrieval precision for dense docs?',
      'Can you show how to integrate Cohere Rerank or BGE Reranker to re-rank top-k search results?',
      'How do HNSW index parameters (`M` and `ef_construction`) affect query latency vs recall in Qdrant/pgvector?',
      'Write a FastAPI endpoint that streams LLM responses with grounded citations from retrieved context chunks.',
      'How can we evaluate RAG hallucination and answer relevance using the RAGAS framework?',
      'What is Parent Document Retrieval and when should we store parent documents separately from child vector chunks?',
      'How do we handle multi-modal documents containing both text tables and embedded chart images?',
      'Can you implement an async background worker in Celery to process incoming PDF uploads into vector embeddings?',
      'Show how to implement document-level metadata filtering (e.g. user permissions) efficiently in vector queries.',
      'What are the trade-offs between local embedding models (e.g. `nomic-embed-text`) vs API providers (OpenAI text-embedding-3)?',
      'How do we prevent prompt injection attacks when injecting raw retrieved context chunks into LLM system prompts?',
      'Write a Python script to benchmark QPS (queries per second) and p99 latency of our vector index.',
      'Summarize best practices for maintaining a vector store in production as document versions update.',
    ],
    sampleCode: `# hybrid_retriever.py
from langchain_community.retrievers import BM25Retriever
from sentence_transformers import CrossEncoder

class HybridRAGRetriever:
    def __init__(self, vector_store, docs):
        self.vector_store = vector_store
        self.bm25 = BM25Retriever.from_documents(docs)
        self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

    async def search(self, query: str, top_k: int = 5):
        dense_results = await self.vector_store.asimilarity_search(query, k=top_k * 2)
        sparse_results = self.bm25.get_relevant_documents(query)[:top_k * 2]
        combined = list({doc.page_content: doc for doc in dense_results + sparse_results}.values())
        pairs = [[query, doc.page_content] for doc in combined]
        scores = self.reranker.predict(pairs)
        ranked = sorted(zip(combined, scores), key=lambda x: x[1], reverse=True)
        return [doc for doc, score in ranked[:top_k]]`,
  },

  {
    id: 'rust-concurrency',
    topic: 'Rust Async Systems Programming & Lock-Free Data Structures',
    lang: 'rust',
    prompts: [
      'How do I implement a lock-free Single-Producer Single-Consumer (SPSC) ring buffer queue in Rust?',
      'Can you explain memory ordering (`AtomicOrdering::Acquire`, `Release`, `SeqCst`) with a code walkthrough?',
      'How do `Send` and `Sync` traits work under the hood, and when do we need `unsafe impl`?',
      'Can you refactor this mutex-heavy code to use atomic operations and `ArcSwap` for lock-free reader threads?',
      "How does Tokio's cooperative task scheduling work when executing CPU-bound vs I/O-bound tasks?",
      'Show how to implement custom Future and Waker mechanisms without depending on external crates.',
      'What are the common pitfalls with interior mutability (`RefCell` vs `UnsafeCell` vs `RwLock`)?',
      'How can we benchmark memory allocations and cache misses using Criterion.rs and Valgrind?',
      'Write unit tests verifying thread safety under high concurrency using Loom (`loom::model`)',
      'How do pin projection and `Pin<&mut Self>` prevent self-referential struct memory moves?',
      'Can you explain zero-cost abstractions in Rust with binary size disassembly comparison?',
      'How do we write a clean C FFI wrapper over our Rust concurrency library?',
      'Show how to handle panic propagation safely across thread boundaries without crashing the host process.',
      'Summarize key design rules for building high-performance low-latency Rust services.',
    ],
    sampleCode: `// spsc.rs
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

pub struct SpscQueue<T, const N: usize> {
    buffer: [Option<T>; N],
    head: AtomicUsize,
    tail: AtomicUsize,
}

impl<T, const N: usize> SpscQueue<T, N> {
    pub fn push(&self, item: T) -> Result<(), T> {
        let tail = self.tail.load(Ordering::Relaxed);
        let head = self.head.load(Ordering::Acquire);
        if tail.wrapping_add(1) % N == head {
            return Err(item); // Queue full
        }
        // Safety: Enforced single producer access
        self.tail.store(tail.wrapping_add(1) % N, Ordering::Release);
        Ok(())
    }
}`,
  },

  {
    id: 'cybersecurity-oauth',
    topic: 'OAuth 2.1 & OpenID Connect Zero-Trust Security Audit',
    lang: 'json',
    prompts: [
      'Can you perform a security audit on our OAuth 2.1 authorization code flow with PKCE implementation?',
      'What are the risks of using Implicit Grant or Resource Owner Password Credentials grant in modern web apps?',
      'How do we properly implement JWT signing key rotation (JWKS) with zero downtime?',
      'What is token binding (DPoP - Demonstration of Proof-of-Possession) and how does it prevent token theft?',
      'Show how to secure HTTP-only SameSite cookies against CSRF and Subdomain Takeover attacks.',
      'How should API gateways validate JWT claims (iss, aud, exp, nbf) and maintain revocation lists (JTI blackout)?',
      'Draft a threat model using STRIDE for a multi-tenant SaaS authentication service.',
      'How do we prevent replay attacks during OAuth state and nonce verification?',
      'Provide a SAST security review checklist for Node.js / Express authentication endpoints.',
      'Write a bash script using `curl` and `jq` to test token endpoint security headers and CORS policy.',
      'How do fine-grained authorization policies (ABAC / ReBAC) fit into microservices identity design?',
      'What are the key differences between OpenID Connect userinfo endpoint vs JWT token claims?',
      'How do we implement emergency session revocation across web and mobile active sessions?',
      'Provide a final audit summary report detailing critical findings and recommended mitigations.',
    ],
    sampleCode: `// Security Headers & JWT Verification Config
{
  "jwksUri": "https://auth.example.com/.well-known/jwks.json",
  "issuer": "https://auth.example.com/",
  "audience": "https://api.example.com/v1",
  "algorithms": ["RS256"],
  "securityHeaders": {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  }
}`,
  },

  {
    id: 'quantum-computing',
    topic: 'Quantum Computing Fundamentals & Post-Quantum Cryptography',
    lang: 'python',
    prompts: [
      "Can you explain Shor's algorithm for prime factorization and why it poses a threat to RSA encryption?",
      "How does Grover's algorithm provide a quadratic speedup for unstructured database search?",
      'Can you write a Qiskit Python script to construct a 3-qubit GHZ state and measure entanglement?',
      'What are quantum logic gates (Hadamard, CNOT, Phase Shift) and how do matrix representations work?',
      'Explain the mathematical formulation of Quantum Decoherence and Quantum Error Correction (Surface Codes).',
      'What is Lattice-Based Cryptography (e.g. CRYSTALS-Kyber and Dilithium) standardized by NIST?',
      'How does Quantum Key Distribution (QKD) using the BB84 protocol guarantee eavesdropping detection?',
      'Show how to simulate a variational quantum eigensolver (VQE) algorithm for calculating molecular energy.',
      'What are the physical hardware trade-offs between superconducting qubits vs trapped ion qubits?',
      'Can you write a Python script estimating the number of physical qubits needed to break RSA-2048?',
      'How does Quantum Teleportation work step-by-step using an EPR pair?',
      'What software frameworks exist for quantum algorithm development (Qiskit vs Pennylane vs Cirq)?',
      'Explain how quantum phase estimation (QPE) forms the core primitive for quantum chemistry simulations.',
      'Summarize the timeline and strategic roadmap for migrating corporate infrastructure to Post-Quantum Cryptography.',
    ],
    sampleCode: `# qiskit_ghz.py
from qiskit import QuantumCircuit, Aer, execute

# Create 3-qubit circuit with 3 classical bits
qc = QuantumCircuit(3, 3)
qc.h(0)         # Put qubit 0 into superposition
qc.cx(0, 1)     # Entangle qubit 0 and 1
qc.cx(1, 2)     # Entangle qubit 1 and 2
qc.measure([0,1,2], [0,1,2])

backend = Aer.get_backend('qasm_simulator')
job = execute(qc, backend, shots=1024)
results = job.result().get_counts()
print("GHZ Measurement Outcomes:", results)`,
  },

  {
    id: 'devops-kubernetes',
    topic: 'Kubernetes GitOps, Terraform & Zero-Downtime Deployment',
    lang: 'yaml',
    prompts: [
      'How do we set up an automated ArgoCD GitOps pipeline for multi-cluster Kubernetes deployments?',
      'Can you write a Terraform module for provisioning an Amazon EKS cluster with managed node groups and VPC?',
      'How does Argo Rollouts enable Canary deployments with dynamic traffic splitting via NGINX Ingress?',
      'Show how to configure Kubernetes Horizontal Pod Autoscaler (HPA) using custom Prometheus metrics.',
      'How do we manage secrets securely in K8s using HashiCorp Vault and External Secrets Operator?',
      'Write a Kubernetes PodDisruptionBudget and topologySpreadConstraints manifest for high availability.',
      'What are the best practices for setting CPU/Memory requests and limits to prevent OOMKilled pods?',
      'How do service meshes (Istio vs Linkerd) implement mTLS identity verification between microservices?',
      'Show how to automate static security scans on K8s manifests using Trivy and OPA Gatekeeper policies.',
      'Write a Helm v3 chart template with value overrides for dev, staging, and production environments.',
      'How do we perform zero-downtime database schema migrations during canary pod rollouts?',
      'Can you write a Chaos Engineering experiment using LitmusChaos to simulate node failure during peak traffic?',
      'Explain the difference between K8s Ingress Controller vs Gateway API (Gateway, HTTPRoute).',
      'Provide a operational runbook for troubleshooting a CrashLoopBackOff error on production deployments.',
    ],
    sampleCode: `# canary-rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: payment-canary
      stableService: payment-stable
      steps:
      - setWeight: 10
      - pause: { duration: 15m }
      - setWeight: 50
      - pause: { duration: 30m }
      trafficRouting:
        nginx:
          stableIngress: payment-ingress`,
  },

  {
    id: 'mobile-crdt',
    topic: 'Offline-First Mobile Architecture with SQLite & CRDT Sync',
    lang: 'typescript',
    prompts: [
      'How do we design an offline-first mobile sync engine using local SQLite and Conflict-free Replicated Data Types (CRDTs)?',
      'What is the difference between State-based (CvRDT) vs Operation-based (CmRDT) synchronization?',
      'Can you write a TypeScript implementation of a LWW-Element-Set (Last-Write-Wins) register for mobile state?',
      'How should background data sync tasks be scheduled on iOS (BackgroundTasks framework) and Android (WorkManager)?',
      'What strategy prevents SQLite database lock errors when background sync threads write while UI reads?',
      'How do we handle file attachment/blob storage sync efficiently over slow 3G network connections?',
      'Write a client-side database schema using WatermelonDB / Expo SQLite with migration versioning.',
      'How can we compress sync delta payloads using Protocol Buffers or MessagePack?',
      'Show how to implement biometric authentication (TouchID / FaceID) key storage in Keychain / KeyStore.',
      'How do we handle server-side conflict resolution when client device clocks drift significantly?',
      'Write unit tests simulating offline network toggling and concurrent write operations.',
      'How can mobile analytics events be queued locally without losing data when the app crashes?',
      'Show how to profile memory usage and battery drain of local sync loops on React Native.',
      'Summarize key recommendations for building smooth 60fps offline mobile user experiences.',
    ],
    sampleCode: `// crdt-register.ts
export interface LWWRegister<T> {
  value: T;
  timestamp: number;
  peerId: string;
}

export function mergeLWW<T>(a: LWWRegister<T>, b: LWWRegister<T>): LWWRegister<T> {
  if (a.timestamp > b.timestamp) return a;
  if (b.timestamp > a.timestamp) return b;
  return a.peerId > b.peerId ? a : b;
}`,
  },

  {
    id: 'scifi-worldbuilding',
    topic: 'Hard Sci-Fi Universe Creation & Orbital Mechanics Fiction',
    lang: 'markdown',
    prompts: [
      "Let's design a hard sci-fi solar system set in the 25th century focused around a partially constructed Dyson Swarm.",
      'Can you write a detailed lore document explaining the economic and technological friction between Inner Planets and Outer Belt Belters?',
      'Write a dramatic dialogue scene between a Station Commander and a Quantum Communications Analyst discovering an anomaly.',
      'How would artificial gravity created via spin habitats impact daily life, architecture, and sports in space stations?',
      'Can you generate a technical specification sheet for a Fusion-Torch Propulsion Starship (Kestrel-Class)?',
      'Write a outline for a 3-act novel exploring the ethical dilemma of uploaded artificial minds running station infrastructure.',
      'Draft the opening chapter (Prologue) with vivid atmospheric descriptions, tense pacing, and sensory details.',
      'What realistic scientific constraints (delta-v budgets, thermal radiation radiators, G-force tolerances) should ground the story?',
      'Create a glossary of unique slang, political acronyms, and technical jargon spoken by space miners.',
      'How would light-lag communications affect inter-system diplomacy and financial stock trading across light-hours?',
      'Write a monologue from the antagonist defending their decision to sabotage the orbital mirror solar collector.',
      'Describe a futuristic zero-g dining experience and culinary synthesis techniques.',
      'How would judicial systems and law enforcement operate when exile into vacuum is a constant physical reality?',
      'Summarize the central themes, character arcs, and world-building highlights of this universe.',
    ],
    sampleCode: `### KESTREL-CLASS FUSION TORCH SPECIFICATIONS

* **Drive Type**: Deuterium-Helium-3 Magnetic Confinement Inertial Fusion
* **Specific Impulse (Isp)**: 120,000 seconds
* **Peak Acceleration**: 3.5 g (Internal inertial dampening field arrays)
* **Heat Dissipation**: Graphene droplet radiator arrays (1,200 sq. meters)
* **Hull Composition**: Carbon-nanotube weave over depleted uranium orbital shielding`,
  },

  {
    id: 'algotrading-python',
    topic: 'Algorithmic Trading, Backtesting & Market Microstructure',
    lang: 'python',
    prompts: [
      'How do I build a statistical arbitrage mean-reversion trading strategy using Cointegration in Python?',
      'Can you write a Backtrader script that runs a vectorized backtest with slippage, commissions, and position sizing?',
      'How do we calculate the Sharpe ratio, Sortino ratio, and Maximum Drawdown metrics programmatically?',
      'Explain how order book dynamics (bid-ask spread, order depth, Level 2 data) impact market impact costs.',
      'How should we ingest high-frequency WebSocket data streams from Binance/Interactive Brokers without dropping frames?',
      'Can you build a Kalman Filter implementation for dynamic hedge ratio estimation between two correlated assets?',
      'What are the dangers of over-fitting and look-ahead bias in backtests, and how does Walk-Forward Optimization help?',
      'Show how to implement a Risk Management stop-loss and trailing stop rules engine in Python.',
      'How do we train an XGBoost or Random Forest model on technical indicators without target leakage?',
      'Write a system architecture diagram for an automated execution bot running on AWS EC2 with low latency.',
      'How do market makers use the Avellaneda-Stoikov model to set optimal bid and ask quotes?',
      'Show how to connect to Interactive Brokers API (ib_insync) to place bracket orders safely.',
      'Write unit tests mocking market feed failures and verifying kill-switch behavior.',
      'Summarize the performance evaluation metrics report for the trading system.',
    ],
    sampleCode: `# mean_reversion.py
import numpy as np
import pandas as pd
import statsmodels.api as sm

def calculate_coint_pairs(series_a, series_b):
    # Perform Engle-Granger two-step cointegration test
    model = sm.OLS(series_a, sm.add_constant(series_b)).fit()
    hedge_ratio = model.params[1]
    spread = series_a - hedge_ratio * series_b
    z_score = (spread - spread.mean()) / spread.std()
    return hedge_ratio, z_score`,
  },

  {
    id: 'design-system-css',
    topic: 'Modern CSS Architecture, Glassmorphism & UI Component Systems',
    lang: 'css',
    prompts: [
      'How do we build a modern scalable CSS custom properties design system supporting dynamic Dark/Light/Custom themes?',
      'Can you show how to code a responsive Glassmorphic Card component using `backdrop-filter`, subtle gradients, and CSS borders?',
      'How do CSS Container Queries (`@container`) revolutionize component-driven layout design over media queries?',
      'Write a WCAG AAA compliant color system using OKLCH color space for perceptually uniform palette scales.',
      'How do we implement smooth micro-interactions and View Transitions API animations between page state changes?',
      'Show how to construct an accessible Modal Drawer component with focus trapping and keyboard shortcuts (`Escape`).',
      'What is the best way to organize modular CSS using `:has()` selectors to eliminate JS state classes?',
      'Write fluid typography and dynamic spacing utility rules using `clamp()`, `calc()`, and viewport units.',
      'How can custom scrollbars and focus-visible rings be styled elegantly across Firefox, Chrome, and Safari?',
      'Show how to build a responsive grid component that auto-fits items with minimum item width boundaries.',
      'What are the performance implications of complex CSS box-shadows and backdrop filters on mobile GPU rendering?',
      'Write an automated style dictionary script converting tokens from Figma JSON into CSS variables.',
      'Show how to unit test CSS accessibility using Axe-core and Playwright browser tests.',
      'Summarize the design system token documentation for engineering and product design teams.',
    ],
    sampleCode: `/* design-tokens.css */
:root {
  --color-brand-primary: oklch(0.62 0.22 255);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-blur: blur(16px);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.45);
}`,
  },

  {
    id: 'compiler-ast',
    topic: 'Compiler Design, Lexical Analysis & Babel AST Transformations',
    lang: 'javascript',
    prompts: [
      'How do I write a custom Babel plugin that rewrites specific console log calls into structured telemetry events?',
      'Can you explain the stages of a compiler: Lexing/Tokenization, Parsing, Abstract Syntax Tree (AST), and Code Generation?',
      'Write a minimal recursive descent parser in JavaScript for arithmetic expressions supporting `+`, `-`, `*`, `/`, and parentheses.',
      'How do Babel visitors work and how do we handle scope binding (`path.scope`) during AST mutation?',
      'Can you show how TypeScript uses type checker APIs to inspect type annotations during AST traversal?',
      'How do we write source map mappings (`sourcemap`) accurately when transforming source code lines?',
      'Show how to write automated AST unit tests using Jest and snapshot testing.',
      'What are the differences between LR(1) vs LL(k) parser generators like ANTLR vs Nearley?',
      'Write a custom ESLint rule that disallows async functions inside array `.map()` without `Promise.all`.',
      'How do dead code elimination (tree shaking) algorithms identify unused exports in AST module graphs?',
      'Can you demonstrate how to compile a DSL string into executable JavaScript code safely?',
      'How do web bundlers (SWC, ESBuild, Vite) achieve 10x-100x speedups using Rust/Go AST parsers?',
      'Write a benchmark test script comparing Babel transform speed vs SWC transform speed.',
      'Summarize the architecture guide for contributing custom transformations to the compiler repository.',
    ],
    sampleCode: `// babel-plugin-telemetry.js
module.exports = function({ types: t }) {
  return {
    name: "telemetry-transform",
    visitor: {
      CallExpression(path) {
        if (
          t.isMemberExpression(path.node.callee) &&
          path.node.callee.object.name === "console" &&
          path.node.callee.property.name === "log"
        ) {
          path.replaceWith(
            t.callExpression(t.identifier("telemetry.trackLog"), path.node.arguments)
          );
        }
      }
    }
  };
};`,
  },

  {
    id: 'neo4j-graph-analytics',
    topic: 'Graph Database Modeling & Cypher Traversal Queries in Neo4j',
    lang: 'cypher',
    prompts: [
      'How do we model a complex social network and fraud detection graph in Neo4j using nodes, labels, and relationships?',
      'Can you write a Cypher query using variable length paths (`-[:FRIEND_OF*1..3]->`) to find recommendation connections?',
      'How do PageRank and Louvain Community Detection algorithms execute inside Neo4j Graph Data Science (GDS) library?',
      'What index types (range indexes, text indexes, point indexes) exist in Neo4j and how do we optimize query profiles?',
      'Write a Cypher query using pattern matching to detect fraudulent circular money transfer loops between accounts.',
      'How do we integrate Neo4j with GraphQL using `@neo4j/graphql` for auto-generated schema mutations?',
      'What are the trade-offs of using Graph DBs versus relational tables with recursively joined CTEs?',
      'Show how to import large CSV datasets (10M nodes) using `LOAD CSV` with periodic commit batches.',
      'How do we configure Neo4j Causal Clustering for high-availability read replicas and leader election?',
      'Write a Python `neo4j` driver wrapper executing multi-statement bolt protocol transactions safely.',
      'How do we manage graph schema migrations when property definitions evolve across releases?',
      'Show how to write automated Cypher query integration tests using Testcontainers in Java/TypeScript.',
      'What memory tuning configuration (`dbms.memory.heap.initial_size` vs `pagecache`) maximizes traversal speed?',
      'Provide a full graph data model documentation layout for the engineering team.',
    ],
    sampleCode: `// Cypher Fraud Detection Query
MATCH path = (origin:Account)-[:TRANSFERRED_FUNDS*3..6]->(origin)
WHERE ALL(r IN relationships(path) WHERE r.amount > 10000)
  AND duration.between(relationships(path)[0].timestamp, nodes(path)[-1].timestamp).hours < 24
RETURN path, 
       reduce(total = 0, r IN relationships(path) | total + r.amount) AS total_stolen
ORDER BY total_stolen DESC
LIMIT 10;`,
  },

  {
    id: 'threejs-webgl-shaders',
    topic: 'WebGL, 3D Graphics & Custom GLSL Shaders in Three.js',
    lang: 'glsl',
    prompts: [
      'How do I create a custom GLSL Fragment Shader in Three.js for rendering animated ocean water waves?',
      'Can you explain Vertex Shaders vs Fragment Shaders, Uniforms, Attributes, and Varyings?',
      'Write a GLSL shader incorporating Simplex Noise / Perlin Noise for procedural terrain height displacement.',
      'How do we optimize rendering 100,000 interactive particles using `InstancedBufferGeometry` at 60 FPS?',
      'Show how to set up post-processing bloom and depth-of-field effects using `EffectComposer` in Three.js.',
      'How do PBR (Physically Based Rendering) materials work, including Roughness, Metalness, and Normal maps?',
      'Write a JavaScript animation loop managing Three.js render loops, delta time, and window resize events.',
      'How can we load and optimize GLTF / GLB 3D models using Draco mesh compression?',
      'Show how to perform raycasting mouse picking for 3D objects with accurate bounding volume hierarchies (BVH).',
      'Write a custom shadow map shader pass for soft dynamic shadows.',
      'How do WebGPU and WGSL differ from WebGL and GLSL for modern browser graphics rendering?',
      'Show how to debug GPU memory leaks (geometries, textures, materials) when unmounting Three.js scenes.',
      'Write automated visual regression tests for WebGL canvas scenes using Playwright.',
      'Summarize performance optimization rules for smooth WebGL experiences on mobile devices.',
    ],
    sampleCode: `// fragment-shader.glsl
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    vec3 color = vec3(0.0);
    
    // Wave calculations
    float wave = sin(st.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
    color = mix(vec3(0.05, 0.2, 0.4), vec3(0.2, 0.8, 0.9), wave);
    
    gl_FragColor = vec4(color, 1.0);
}`,
  },

  {
    id: 'saas-pricing-strategy',
    topic: 'B2B SaaS Go-To-Market (GTM) & Monetization Strategy',
    lang: 'markdown',
    prompts: [
      'We are building a developer tool SaaS. How should we design our pricing tiers (Free, Pro, Enterprise)?',
      'What are the pros and cons of Usage-Based Pricing (e.g. per API call/seat) vs Tiered Flat-Rate Subscription?',
      'How do we structure a Reverse Trial strategy to maximize conversion rates from free users to paid tiers?',
      'Can you write a high-converting cold email sequence for reaching out to VP of Engineering leads?',
      'How should we calculate key SaaS metrics: CAC, LTV, Net Retention Rate (NRR), and Churn Rate?',
      'Draft a sales battlecard comparing our dev tool against key incumbent competitors.',
      'How do we implement a self-serve onboarding flow that shortens Time-To-Value (TTV) to under 5 minutes?',
      'Write a customer feedback interview transcript framework to discover feature willingness-to-pay.',
      'How should we handle enterprise compliance security requests (SOC2 Type II, HIPAA, ISO 27001)?',
      'Create a product launch announcement blog post for Hacker News and Product Hunt.',
      'How do we design an automated dunning email campaign for failed credit card renewals?',
      'Write an executive pitch deck slide outline for a $3M Seed funding round.',
      'How can we build an effective developer community (Discord/GitHub) that drives organic growth?',
      'Summarize the key growth levers and strategic priorities for the upcoming quarters.',
    ],
    sampleCode: `### B2B SAAS PRICING MATRIX RECOMMENDATION

| Metric / Feature | Developer (Free) | Pro ($29/mo/user) | Enterprise (Custom) |
|---|---|---|---|
| Monthly Requests | 10,000 | 500,000 | Unlimited |
| Team Members | 1 user | Up to 10 users | Unlimited + SSO / SAML |
| Audit Logs | 7 Days | 90 Days | Unlimited + SIEM Export |
| SLA Support | Community | 99.9% / Email | 99.99% / 24/7 Phone & Dedicated AM |`,
  },

  {
    id: 'esp32-iot-firmware',
    topic: 'ESP32 C/C++ Embedded Firmware & MQTT over TLS Security',
    lang: 'cpp',
    prompts: [
      'How do I write low-power ESP32 C++ firmware using FreeRTOS tasks to read sensor data every 5 minutes?',
      'Can you show how to connect securely to AWS IoT Core over MQTT using X.509 client certificates?',
      'How does ESP32 Deep Sleep mode work, and how do we store persistent calibration state in RTC memory?',
      'Write a C++ watchdog timer (WDT) implementation to reset the microcontroller if a sensor thread freezes.',
      'How do we implement Over-The-Air (OTA) firmware updates over HTTPS with cryptographic signature verification?',
      'Show how to parse incoming binary Protocol Buffer payloads on embedded microcontrollers with minimal RAM.',
      'How do we handle Wi-Fi reconnection logic and offline data queueing in Flash SPIFFS / LittleFS storage?',
      'Write a GPIO interrupt handler for measuring high-speed pulse frequency without blocking the main CPU loop.',
      'How do we profile heap memory consumption (`esp_get_free_heap_size()`) to eliminate memory leaks?',
      'Show how to configure secure boot and flash encryption on ESP32-S3 chips.',
      'Write unit tests for sensor data calibration logic using GoogleTest / Unity test framework.',
      'How do we implement hardware I2C bus recovery if a sensor pulls the SDA line low indefinitely?',
      'Show how to monitor battery voltage levels using internal ADC with attenuation.',
      'Summarize the production manufacturing hardware testing procedures.',
    ],
    sampleCode: `// esp32_mqtt.cpp
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "esp_sleep.h"

#define BUTTON_PIN GPIO_NUM_4
RTC_DATA_ATTR int bootCount = 0;

void setup() {
    Serial.begin(115200);
    ++bootCount;
    Serial.printf("Boot count: %d\\n", bootCount);
    
    // Configure deep sleep wake source
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 0);
    
    // Perform quick sensor read & MQTT publish
    // ...
    
    Serial.println("Going to deep sleep...");
    esp_deep_sleep_start();
}`,
  },

  {
    id: 'agi-ethics-philosophy',
    topic: 'Philosophy of Mind, Chinese Room Argument & AGI Alignment',
    lang: 'markdown',
    prompts: [
      "How does John Searle's Chinese Room thought experiment challenge Strong AI and functionalism theories?",
      'Can you compare Functionalism, Physicalism, and Dualism perspectives on machine consciousness?',
      'What is Integrated Information Theory (IIT - Phi metric) proposed by Giulio Tononi, and how is it calculated?',
      'How does the AI Alignment Problem (Instrumental Convergence & Orthogonality Thesis) manifest in LLMs?',
      'Draft a philosophical dialogue between Alan Turing and Ned Block discussing the Blockhead argument.',
      'What are the moral status implications of autonomous AI agents capable of experiencing simulated suffering?',
      "How do modern Transformer models challenge Noam Chomsky's theory of Universal Grammar?",
      'What is the difference between Epiphenomenalism and Emergentism regarding conscious experience?',
      "How does Daniel Dennett's Intentional Stance framework help us interpret large model decision-making?",
      'Draft an ethical framework for governing recursive self-improving superintelligent AI systems.',
      "Explain the Mary's Room (Knowledge Argument) thought experiment by Frank Jackson.",
      "How does the concept of 'Bounded Rationality' by Herbert Simon apply to multi-agent artificial systems?",
      'Can machines possess genuine intentionality, or are they forever limited to semantic emulation?',
      'Summarize key takeaways for AI safety researchers and ethicists.',
    ],
    sampleCode: `> **The Chinese Room Distinction**:
> Searle argues that executing syntactical symbol manipulation rules (software) is fundamentally insufficient to guarantee semantic comprehension (meaning). A machine can pass the Turing Test by matching inputs to outputs without any subjective internal state (*qualia*).`,
  },

  {
    id: 'audio-dsp-juce',
    topic: 'Digital Audio Signal Processing (DSP) & C++ JUCE Plugin',
    lang: 'cpp',
    prompts: [
      'How do I write a C++ audio processor plugin in JUCE implementing a 4-pole State Variable Filter (SVF)?',
      'Can you explain digital audio sampling theory: Nyquist-Shannon Theorem, Aliasing, and Oversampling?',
      'Write a C++ class for a Bandlimited Wavetable Synthesizer oscillator generating Sawtooth and Square waves.',
      'How do we design an ADSR Envelope Generator with exponential attack, decay, and release curves?',
      'Show how to implement a Stereo Delay plugin with Ping-Pong feedback and tape-style pitch modulation.',
      'How do we prevent CPU audio buffer underruns and crackles in the real-time audio thread?',
      'Write a Fast Fourier Transform (FFT) spectrum analyzer algorithm displaying real-time audio frequencies.',
      'How do lock-free FIFO queues transfer parameter automation data from the GUI thread to the audio thread?',
      'Show how to build a custom vector graphics UI editor in JUCE using custom LookAndFeel styles.',
      'How do we compile and bundle VST3, AU, and AAX audio plugin formats across macOS and Windows?',
      'Write SIMD vector optimizations using SSE/AVX intrinsics for parallel audio sample processing.',
      'How do we implement peak metering and LUFS loudness calculation compliant with EBU R128 standards?',
      'Show unit tests for audio filter impulse response verification using Catch2.',
      'Summarize the release engineering guide for distribution to digital audio workstations (DAWs).',
    ],
    sampleCode: `// SvfFilter.cpp
#include <JuceHeader.h>

class StateVariableFilter {
public:
    void setCutoffAndResonance(float cutoffHz, float Q, double sampleRate) {
        float g = std::tan(juce::MathConstants<float>::pi * cutoffHz / sampleRate);
        k = 1.0f / Q;
        a1 = 1.0f / (1.0f + g * (g + k));
        a2 = g * a1;
        a3 = g * a2;
    }

    float processLowPass(float input) {
        float v3 = input - ic2eq;
        float v1 = a1 * ic1eq + a2 * v3;
        float v2 = ic2eq + a2 * ic1eq + a3 * v3;
        ic1eq = 2.0f * v1 - ic1eq;
        ic2eq = 2.0f * v2 - ic2eq;
        return v2; // Low-pass output
    }
private:
    float k = 1.0f, a1 = 0, a2 = 0, a3 = 0;
    float ic1eq = 0, ic2eq = 0;
};`,
  },

  {
    id: 'bioinformatics-dna',
    topic: 'Genomic Sequence Alignment & Bioinformatics Pipelines in Python',
    lang: 'python',
    prompts: [
      'How do we build a Python script to parse FASTQ quality scores and filter low-quality DNA sequencing reads?',
      'Can you explain the Needleman-Wunsch global alignment algorithm vs Smith-Waterman local alignment algorithm?',
      'Write a Python implementation of the Burrows-Wheeler Transform (BWT) used in Bowtie / BWA alignment tools.',
      'How do we call genetic variants (SNPs and Indels) from SAM/BAM files using PySam and BioPython?',
      'Show how to parse VCF (Variant Call Format) files to extract pathogenic mutations listed in ClinVar.',
      'How does K-mer counting work for genome assembly and abundance estimation using Jellyfish / Python dicts?',
      'Write a Parallel Processing pipeline using Python `multiprocessing` to align 100 FASTQ sample files.',
      'How do we calculate GC content distribution and plot sequence quality metrics using Matplotlib / Seaborn?',
      'Explain how Hidden Markov Models (HMMs) are used in gene prediction algorithms like AUGUSTUS.',
      'Write a script converting RNA-seq raw gene counts into TPM (Transcripts Per Million) normalization metrics.',
      'How do vector databases enable semantic search over protein structure databases (PDB files)?',
      'Show how to build an interactive genome browser visualization widget in Streamlit.',
      'Write unit tests validating DNA reverse complement and transcription translation functions.',
      'Summarize the bioinformatics reproducibility report for clinical sequencing compliance.',
    ],
    sampleCode: `# bwt_alignment.py
def burrows_wheeler_transform(sequence: str) -> str:
    sequence += "$"
    table = sorted(sequence[i:] + sequence[:i] for i in range(len(sequence)))
    return "".join(row[-1] for row in table)

def gc_content(sequence: str) -> float:
    gc_count = sum(1 for base in sequence.upper() if base in ("G", "C"))
    return (gc_count / len(sequence)) * 100.0`,
  },

  {
    id: 'api-graphql-grpc',
    topic: 'API Protocol Evaluation: REST vs GraphQL Federation vs gRPC',
    lang: 'protobuf',
    prompts: [
      'We need to standardise our internal microservices communication protocol. How do gRPC, GraphQL, and REST compare?',
      'Can you write a `.proto` definition for an E-Commerce Order Service supporting bi-directional streaming?',
      'How does GraphQL Federation v2 allow multiple subgraphs to merge into a single unified gateway schema?',
      'Show how Protocol Buffers serialize binary messages faster than JSON schema serialization.',
      'How should we implement HTTP/2 multiplexing, keep-alive connections, and gRPC load balancing in Envoy?',
      'Write a GraphQL query resolving nested user order history with field-level `@defer` streaming directives.',
      'How do we implement client SDK code generators (OpenAPI Generator vs Buf CLI) in CI/CD pipelines?',
      'What are the best practices for handling API deprecation without breaking external API clients?',
      'Write a gRPC interceptor in Go for automatic JWT metadata authentication and logging.',
      'Show how to benchmark throughput (req/sec) and latency between REST, GraphQL, and gRPC under high load.',
      'How do we handle error handling conventions (gRPC status codes vs GraphQL errors array vs HTTP 4xx/5xx)?',
      'Write a Node.js Apollo Router subgraph configuration for enterprise deployment.',
      'How do web browsers communicate with gRPC backend services via gRPC-Web proxies?',
      "Provide a architectural decision record (ADR) detailing the team's final protocol selection.",
    ],
    sampleCode: `// order_service.proto
syntax = "proto3";

package commerce.v1;

option go_package = "commerce/v1;commercev1";

service OrderService {
  rpc CreateOrder (CreateOrderRequest) returns (OrderResponse);
  rpc StreamOrderUpdates (StreamOrderRequest) returns (stream OrderStatusUpdate);
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated string item_ids = 2;
  double total_amount = 3;
}

message OrderResponse {
  string order_id = 1;
  string status = 2;
  int64 created_at_timestamp = 3;
}`,
  },

  {
    id: 'ebpf-kernel-tracing',
    topic: 'eBPF Tracing, Linux Kernel Space & Network Performance',
    lang: 'c',
    prompts: [
      'How does eBPF allow safe sandboxed execution inside the Linux kernel without recompiling kernel modules?',
      'Can you write a C eBPF program using libbpf that attaches to kprobes to trace `sys_enter_execve` syscalls?',
      'How do eBPF maps (`BPF_MAP_TYPE_HASH`, `BPF_MAP_TYPE_RINGBUF`) pass telemetry data to user space daemon tools?',
      'Explain Express Data Path (XDP) and how it drops DDoS network packets directly at the network card driver layer.',
      'How does the eBPF Verifier enforce memory safety, loop bounds, and static analysis verification?',
      'Write a Python script using BCC (BPF Compiler Collection) to display a real-time disk I/O latency histogram.',
      'How do Cilium and Katran use eBPF to replace kube-proxy iptables for K8s service load balancing?',
      'What is the difference between kprobes, uprobes, tracepoints, and USDT (User Statically Defined Tracing)?',
      'Write an eBPF program measuring socket connection setup latency (`tcp_connect`) across microservices.',
      'How do kernel ring buffers prevent event loss during telemetry traffic spikes?',
      'Show how to debug eBPF verifier error logs (`permission denied`, `unreachable insn`).',
      'How do we package and deploy eBPF programs as OCI artifacts using Cilium Ebpf / CO-RE (Compile Once Run Everywhere)?',
      'Write an automated integration test running eBPF checks inside a Docker container.',
      'Summarize Linux kernel observability capabilities for SRE performance engineers.',
    ],
    sampleCode: `// execve_trace.bpf.c
#include <vmlinux.h>
#include <bpf/bpf_helpers.h>

SEC("tracepoint/syscalls/sys_enter_execve")
int trace_execve(struct trace_event_raw_sys_enter *ctx) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    bpf_printk("Process spawned with PID: %d\\n", pid);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";`,
  },

  {
    id: 'llm-lora-finetuning',
    topic: 'Fine-Tuning Llama Models with QLoRA & HuggingFace PEFT',
    lang: 'python',
    prompts: [
      'How do Parameter-Efficient Fine-Tuning (PEFT) and LoRA (Low-Rank Adaptation) modify weight matrices during training?',
      'Can you write a PyTorch script using HuggingFace `transformers`, `peft`, and `bitsandbytes` for 4-bit QLoRA fine-tuning?',
      'What target modules (`q_proj`, `v_proj`, `k_proj`, `o_proj`) should we inject LoRA adapter matrices into for optimal accuracy?',
      'How do we prepare and format an instruction dataset into standardized JSONL prompt-response pairs?',
      'Explain the trade-offs of hyperparameter choices: rank `r`, `lora_alpha`, dropout, learning rate schedule, and batch size.',
      'How do we merge fine-tuned LoRA weights back into base model weights for zero-overhead inference?',
      'Write an evaluation script computing perplexity and BLEU/ROUGE metrics on a validation dataset.',
      'How does FlashAttention-2 reduce memory footprint and accelerate attention computation during training?',
      'Show how to deploy fine-tuned models using vLLM / Ollama for high throughput API serving.',
      'How can Direct Preference Optimization (DPO) and RLHF align model outputs with human preferences?',
      'Write a script converting HuggingFace PyTorch checkpoints to GGUF format for llama.cpp execution.',
      'How do we monitor GPU VRAM utilization and gradient accumulation steps during multi-GPU DDP training?',
      'Write unit tests verifying model inference output deterministic reproducibility.',
      'Provide a summary report on post-fine-tuning evaluation benchmarks.',
    ],
    sampleCode: `# qlora_finetune.py
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.3-70B-Instruct", quantization_config=bnb_config)
model = prepare_model_for_kbit_training(model)

peft_config = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"], lora_dropout=0.05, bias="none", task_type="CAUSAL_LM"
)
model = get_peft_model(model, peft_config)
model.print_trainable_parameters()`,
  },

  {
    id: 'solidity-smart-contract',
    topic: 'Solidity Smart Contract Security, Reentrancy & Foundry Audits',
    lang: 'solidity',
    prompts: [
      'Can you audit this Solidity ERC-20 Staking Contract for reentrancy vulnerabilities and integer precision issues?',
      'How does the Checks-Effects-Interactions pattern prevent reentrancy attacks in smart contracts?',
      'Write a Foundry (`forge test`) test suite simulating a Flash Loan attack vector against a liquidity pool.',
      'What are the gas optimization trade-offs of using `calldata` vs `memory`, `immutable` vs `constant`, and custom errors?',
      'How do OpenZeppelin `ReentrancyGuard` and `Pausable` modifiers protect contract state changes?',
      'Write a Slither static analyzer script for automating security checks in CI/CD GitHub Actions.',
      'How do UUPS (Universal Upgradeable Proxy Standard) and Transparent Proxy patterns handle contract state preservation?',
      'Show how to calculate token rewards using fixed-point math (`WAD` / `RAY` scaling factors).',
      'Write an EIP-712 typed data signing verification function in Solidity using `ecrecover`.',
      'How do we monitor on-chain contract events (`emit Transfer`) using Tenderly or Alchemy webhooks?',
      'Show how to set up invariant testing and fuzz testing using Echidna or Foundry Fuzzing.',
      'What are front-running and MEV (Maximal Extractable Value) attacks, and how do commit-reveal schemes mitigate them?',
      'Write a hardhat / forge script for deploying contracts onto Ethereum Mainnet with Etherscan verification.',
      'Provide a formal Smart Contract Security Audit Summary Report for stakeholders.',
    ],
    sampleCode: `// StakingContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingVault is ReentrancyGuard {
    IERC20 public immutable stakingToken;
    mapping(address => uint256) public balances;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _token) {
        stakingToken = IERC20(_token);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Checks-Effects-Interactions Pattern
        balances[msg.sender] -= amount;
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
}`,
  },

  {
    id: 'gtd-engineering-management',
    topic: 'Engineering Management: GTD Systems, Sprint Velocity & Leadership',
    lang: 'markdown',
    prompts: [
      'How can an Engineering Manager customize the Getting Things Done (GTD) framework to manage high interrupt loads?',
      'How do we balance technical debt reduction (20% rule) against product feature velocity during sprint planning?',
      'Can you write a template for conducting effective 1-on-1 meetings that foster career growth and psychological safety?',
      'How do we design a transparent Career Ladder Matrix (IC1 to IC6) for software engineers?',
      'Draft a blameless Post-Mortem Incident Review document following a major production outage.',
      'How do we measure engineering team health using DORA metrics (Deployment Frequency, Lead Time, CFR, MTTR)?',
      'Write a framework for delegating technical decisions using RFCs (Request for Comments) and Architecture Decision Records (ADRs).',
      'How should engineering leaders manage performance underperformance with empathy and clarity?',
      'Draft a 90-day onboarding roadmap for a Senior Staff Engineer joining an enterprise company.',
      'How do we prevent developer burnout during intense critical release deadlines?',
      'Write a communication plan for announcing an internal team restructuring or tech stack pivot.',
      'How do we organize effective incident response on-call rotations using PagerDuty and escalation policies?',
      'Show how to conduct an objective sprint retrospective with remote team members.',
      'Summarize strategic management goals for the upcoming fiscal quarter.',
    ],
    sampleCode: `### DORA METRICS TARGET BENCHMARKS

* **Deployment Frequency**: Multiple deployments per day (Elite tier)
* **Lead Time for Changes**: Less than 1 hour from commit to production
* **Mean Time to Recover (MTTR)**: Under 30 minutes for P1 incidents
* **Change Failure Rate (CFR)**: 0% - 5% of deployed releases requiring hotfix`,
  },
];

// ---------------------------------------------------------------------------
// Model Response Generators with Realistic Personalities & Formatting
// ---------------------------------------------------------------------------
function generateModelResponse(model, domain, userPrompt, turnIndex) {
  const modelName = model.name;
  const provider = model.provider;
  const isDeepSeek = model.id === 'deepseek-r1';
  const lang = domain.lang || 'typescript';

  let output = [];

  // DeepSeek R1 includes rich reasoning thoughts
  if (isDeepSeek) {
    output.push('<think>');
    output.push(`Analyzing user request for turn #${turnIndex + 1}: "${userPrompt}"`);
    output.push(`Domain Context: ${domain.topic}.`);
    output.push(
      `1. Deconstruct requirements: Evaluate technical constraints, edge cases, and best practices.`
    );
    output.push(
      `2. Architectural design: Ensure clarity, memory efficiency, safety, and scalability.`
    );
    output.push(
      `3. Formatting strategy: Provide explicit ${lang} code examples, markdown headings, and analytical trade-offs.`
    );
    output.push('</think>\n');
  }

  // Model-specific intro tone
  if (provider === 'Anthropic') {
    output.push(`### Analysis & Solution: ${domain.topic}\n`);
    output.push(`Regarding your question for turn #${turnIndex + 1}: *"${userPrompt}"*\n`);
    output.push(
      `Here is a detailed breakdown of the recommended approach, taking into account reliability, maintainability, and clear structural separation.\n`
    );
  } else if (provider === 'OpenAI') {
    output.push(`### Overview\n`);
    output.push(
      `Here is the implementation strategy for **${domain.topic}** (Turn ${turnIndex + 1}):\n`
    );
  } else if (provider === 'Meta') {
    output.push(`## Technical Deep Dive: ${domain.topic}\n`);
    output.push(`Addressing turn #${turnIndex + 1}: *${userPrompt}*\n`);
    output.push(
      `Below is an in-depth breakdown covering core mechanics, implementation details, and benchmark performance.\n`
    );
  } else if (provider === 'Amazon') {
    output.push(`### Solution Summary (${modelName})\n`);
    output.push(`Key recommendations for handling *"${userPrompt}"*:\n`);
  } else {
    output.push(`### Response for ${domain.topic} [Turn ${turnIndex + 1}]\n`);
    output.push(`In response to: *"${userPrompt}"*\n`);
  }

  // Add domain-specific key insights & structured points
  output.push(`#### Key Technical Considerations\n`);
  output.push(
    `1. **System Architecture**: Ensure clear decoupling between data providers and presentation/execution layers.`
  );
  output.push(
    `2. **Performance & Latency**: Minimize overhead, avoid unnecessary thread/process locks, and utilize asynchronous processing where applicable.`
  );
  output.push(
    `3. **Resilience & Edge Cases**: Explicitly manage failure states, rate limits, and network dropouts.\n`
  );

  // Include sample code or structured code snippet
  if (domain.sampleCode) {
    output.push(`#### Recommended Code Implementation (${lang})\n`);
    output.push(`\`\`\`${lang}`);
    output.push(domain.sampleCode);
    output.push(`\`\`\`\n`);
  }

  // Add structured comparison table or callout box every few turns
  if (turnIndex % 3 === 0) {
    output.push(`#### Trade-off Analysis\n`);
    output.push(`| Approach | Pros | Cons | Recommendation |`);
    output.push(`|---|---|---|---|`);
    output.push(
      `| **Pattern A (Standard)** | Simple setup, minimal boilerplate | Harder to scale under extreme load | Great for initial MVP |`
    );
    output.push(
      `| **Pattern B (Advanced)** | High throughput, zero-downtime, async | Higher operational complexity | Preferred for production scale |\n`
    );
  } else if (turnIndex % 3 === 1) {
    output.push(
      `> **Best Practice Note**: Always validate inputs, monitor resource limits in telemetry dashboard, and maintain automated integration tests for this turn sequence.\n`
    );
  }

  // Tailored closing signature
  if (provider === 'Anthropic') {
    output.push(
      `Let me know if you would like to explore specific edge cases or refactor any portion of the code above for turn #${turnIndex + 2}.`
    );
  } else if (provider === 'OpenAI') {
    output.push(
      `Feel free to ask follow-up questions if you need additional unit tests or deployment configurations.`
    );
  } else {
    output.push(
      `Ready for the next turn when you are! Let me know if you need deeper optimization details.`
    );
  }

  return output.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickModels(count) {
  const pool = [...AVAILABLE_MODELS];
  const chosen = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = randInt(0, pool.length - 1);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

function truncateTitle(content, max = 52) {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd() + '…';
}

function generateDynamicFollowUp(domain, turnIndex) {
  const templates = [
    `Can you explain how this handles concurrent requests or high load during turn ${turnIndex + 1}?`,
    `What are the security and privacy implications of this approach for turn ${turnIndex + 1}?`,
    `Can you refactor the code to improve type safety and error handling?`,
    `How would we write automated unit tests and integration tests for this module?`,
    `What telemetry metrics and logging should we export to Prometheus/Datadog?`,
    `Can you provide a step-by-step benchmark script comparing alternative approaches?`,
    `How should we handle backward compatibility and data migration when updating this?`,
    `Can you summarize the top 5 operational best practices for deploying this to production?`,
  ];
  return templates[(turnIndex - domain.prompts.length) % templates.length];
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------
async function main() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  // Ensure indexes match lib/db.ts
  await Promise.all([
    db.collection(COLLECTIONS.sessions).createIndex({ sessionKey: 1 }, { unique: true }),
    db.collection(COLLECTIONS.conversations).createIndex({ sessionKey: 1, updatedAt: -1 }),
    db
      .collection(COLLECTIONS.turns)
      .createIndex({ conversationId: 1, turnIndex: 1 }, { unique: true }),
    db.collection(COLLECTIONS.responses).createIndex({ turnId: 1, modelId: 1 }, { unique: true }),
    db.collection(COLLECTIONS.responses).createIndex({ conversationId: 1 }),
  ]).catch((err) => console.warn('[seed] index warning:', err.message));

  let sessionKey = PROVIDED_SESSION_KEY;
  if (!sessionKey) {
    sessionKey = require('crypto').randomUUID();
    await db.collection(COLLECTIONS.sessions).insertOne({
      sessionKey,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    });
  } else {
    const existing = await db.collection(COLLECTIONS.sessions).findOne({ sessionKey });
    if (!existing) {
      await db.collection(COLLECTIONS.sessions).insertOne({
        sessionKey,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      });
    }
  }

  const convCount = Math.min(MAX_CONVERSATIONS, 50);
  let totalTurns = 0;
  let totalResponses = 0;

  console.log(`Starting database seed for sessionKey: ${sessionKey}...`);
  console.log(
    `Targeting ${convCount} conversations (Min ${MIN_TURNS} turns/conv, 2-${MAX_MODELS} models/conv)\n`
  );

  // Stagger timestamps across the past 30 days
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (let c = 0; c < convCount; c++) {
    // Select domain sequentially or cycle through DOMAINS
    const domain = DOMAINS[c % DOMAINS.length];
    const modelCount = randInt(2, MAX_MODELS);
    const models = pickModels(modelCount);
    const activeModelIds = models.map((m) => m.id);

    // Stagger conversation creation time across past 30 days
    const convAgeMs = Math.floor(thirtyDaysMs * (1 - c / convCount)) + randInt(0, 3600000);
    const convStartTime = new Date(now - convAgeMs);

    const convResult = await db.collection(COLLECTIONS.conversations).insertOne({
      title: 'New conversation',
      sessionKey,
      activeModelIds,
      createdAt: convStartTime,
      updatedAt: convStartTime,
    });
    const conversationId = convResult.insertedId;

    const turnsInConv = randInt(MIN_TURNS, MIN_TURNS + 5); // e.g. 10 to 15 turns
    const turnDocs = [];
    let currentTime = convStartTime.getTime();

    for (let t = 0; t < turnsInConv; t++) {
      // Pick prompt from domain list or generate dynamic follow-up
      const userContent =
        t < domain.prompts.length ? domain.prompts[t] : generateDynamicFollowUp(domain, t);

      // Increment turn time by 2 to 10 minutes per turn
      currentTime += randInt(2 * 60 * 1000, 10 * 60 * 1000);
      const turnTime = new Date(currentTime);

      turnDocs.push({
        conversationId,
        turnIndex: t,
        userMessage: { content: userContent, createdAt: turnTime },
        createdAt: turnTime,
      });
    }

    const insertedTurns = await db.collection(COLLECTIONS.turns).insertMany(turnDocs);

    // Set conversation title based on the 1st turn prompt & update final timestamp
    const firstPrompt = turnDocs[0].userMessage.content;
    const finalTurnTime = turnDocs[turnDocs.length - 1].createdAt;
    await db.collection(COLLECTIONS.conversations).updateOne(
      { _id: conversationId },
      {
        $set: {
          title: truncateTitle(firstPrompt),
          updatedAt: finalTurnTime,
        },
      }
    );

    // Insert per-model responses for each turn
    const responseDocs = [];
    for (let t = 0; t < turnsInConv; t++) {
      const turnId = insertedTurns.insertedIds[t];
      const turnTime = turnDocs[t].createdAt;
      const userPrompt = turnDocs[t].userMessage.content;

      for (const model of models) {
        // Response time completes 2 to 15 seconds after user prompt
        const completedTime = new Date(turnTime.getTime() + randInt(2000, 15000));
        const responseContent = generateModelResponse(model, domain, userPrompt, t);

        responseDocs.push({
          turnId,
          conversationId,
          modelId: model.id,
          gatewayId: model.gatewayId,
          content: responseContent,
          status: 'complete',
          createdAt: turnTime,
          completedAt: completedTime,
        });
      }
    }

    await db.collection(COLLECTIONS.responses).insertMany(responseDocs);

    totalTurns += turnsInConv;
    totalResponses += responseDocs.length;

    console.log(
      `  [${c + 1}/${convCount}] "${truncateTitle(firstPrompt)}" — ${turnsInConv} turns, ${models.length} models (${responseDocs.length} total responses)`
    );
  }

  console.log('\n======================================================');
  console.log('Database Seeding Complete!');
  console.log('======================================================');
  console.log(`  Session Key:   ${sessionKey}`);
  console.log(`  Conversations: ${convCount}`);
  console.log(`  Total Turns:   ${totalTurns}`);
  console.log(`  Total Responses: ${totalResponses}`);
  console.log('======================================================\n');

  await client.close();
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
