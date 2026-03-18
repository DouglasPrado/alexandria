//! Consistent hashing ring com virtual nodes proporcionais a capacidade.
//!
//! Distribui chunks entre nos proporcionalmente a capacidade de cada no.
//! Quando nos entram ou saem, apenas K/N chunks migram (redistribuicao minima).
//! Deterministico: mesmo chunk_id sempre mapeia para mesmos nos.
//!
//! ADR-006, RF-030, RF-013.

use crate::hashing;
use std::collections::BTreeMap;
use uuid::Uuid;

/// Fator base de virtual nodes por GB de capacidade.
/// No com 100GB tera 100 * VNODES_PER_GB virtual nodes.
const VNODES_PER_GB: u64 = 10;

/// Minimo de virtual nodes por no (mesmo com capacidade muito pequena).
const MIN_VNODES: u64 = 10;

/// Consistent hashing ring com virtual nodes proporcionais a capacidade.
/// Deterministico: mesmo chunk_id sempre mapeia para mesmos nos.
pub struct HashRing {
    /// Mapa ordenado: hash_position → node_id
    ring: BTreeMap<u64, Uuid>,
    /// Nodes registrados com suas capacidades
    nodes: std::collections::HashMap<Uuid, u64>,
}

impl HashRing {
    pub fn new() -> Self {
        Self {
            ring: BTreeMap::new(),
            nodes: std::collections::HashMap::new(),
        }
    }

    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }

    /// Adiciona no ao ring com virtual nodes proporcionais a capacidade.
    /// Mais capacidade = mais virtual nodes = mais chunks direcionados.
    pub fn add_node(&mut self, node_id: Uuid, capacity_bytes: u64) {
        let vnodes = self.calc_vnodes(capacity_bytes);
        self.nodes.insert(node_id, capacity_bytes);

        for i in 0..vnodes {
            let key = format!("{node_id}-vnode-{i}");
            let hash = self.hash_position(&key);
            self.ring.insert(hash, node_id);
        }
    }

    /// Remove no e todos os seus virtual nodes do ring.
    pub fn remove_node(&mut self, node_id: &Uuid) {
        if self.nodes.remove(node_id).is_none() {
            return;
        }

        // Remove todos os virtual nodes deste no
        self.ring.retain(|_, v| v != node_id);
    }

    /// Retorna ate `count` nos unicos responsaveis por um chunk.
    /// Caminha no sentido horario a partir da posicao do chunk.
    /// Deterministico: mesmo chunk_id + mesmo ring = mesmos nos.
    pub fn get_nodes(&self, chunk_id: &str, count: usize) -> Vec<Uuid> {
        if self.ring.is_empty() {
            return Vec::new();
        }

        let max = count.min(self.nodes.len());
        let hash = self.hash_position(chunk_id);
        let mut result = Vec::with_capacity(max);
        let mut seen = std::collections::HashSet::with_capacity(max);

        // Percorre a partir do hash em sentido horario (range apos + range antes)
        for (_, &node_id) in self.ring.range(hash..).chain(self.ring.iter()) {
            if seen.insert(node_id) {
                result.push(node_id);
                if result.len() == max {
                    break;
                }
            }
        }

        result
    }

    /// Calcula numero de virtual nodes baseado na capacidade.
    fn calc_vnodes(&self, capacity_bytes: u64) -> u64 {
        let gb = capacity_bytes / 1_000_000_000;
        (gb * VNODES_PER_GB).max(MIN_VNODES)
    }

    /// Hash deterministico de uma string para posicao no ring (u64).
    fn hash_position(&self, key: &str) -> u64 {
        let hash = hashing::sha256(key.as_bytes());
        let bytes = hash.as_bytes();
        // Usa os primeiros 8 bytes do SHA-256 como u64
        u64::from_be_bytes([
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7],
        ])
    }
}

impl Default for HashRing {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn node(id: u128, capacity: u64) -> (Uuid, u64) {
        (Uuid::from_u128(id), capacity)
    }

    // -- Construcao basica --

    #[test]
    fn new_ring_is_empty() {
        let ring = HashRing::new();
        assert_eq!(ring.node_count(), 0);
        assert!(ring.is_empty());
    }

    #[test]
    fn add_node_increases_count() {
        let mut ring = HashRing::new();
        let (id, cap) = node(1, 100_000_000_000); // 100GB
        ring.add_node(id, cap);
        assert_eq!(ring.node_count(), 1);
        assert!(!ring.is_empty());
    }

    #[test]
    fn remove_node_decreases_count() {
        let mut ring = HashRing::new();
        let (id, cap) = node(1, 100_000_000_000);
        ring.add_node(id, cap);
        ring.remove_node(&id);
        assert_eq!(ring.node_count(), 0);
    }

    #[test]
    fn remove_nonexistent_node_is_noop() {
        let mut ring = HashRing::new();
        let (id, _) = node(1, 100_000_000_000);
        ring.remove_node(&id); // nao existe
        assert_eq!(ring.node_count(), 0);
    }

    // -- get_nodes: lookup basico --

    #[test]
    fn get_nodes_returns_requested_count() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);
        ring.add_node(Uuid::from_u128(3), 100_000_000_000);

        let chunk_id = "abc123";
        let nodes = ring.get_nodes(chunk_id, 3);
        assert_eq!(nodes.len(), 3);
    }

    #[test]
    fn get_nodes_returns_unique_nodes() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);
        ring.add_node(Uuid::from_u128(3), 100_000_000_000);

        let nodes = ring.get_nodes("chunk_xyz", 3);
        let unique: std::collections::HashSet<_> = nodes.iter().collect();
        assert_eq!(unique.len(), 3, "nos retornados devem ser unicos");
    }

    #[test]
    fn get_nodes_caps_at_available_nodes() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);

        // Pede 5, mas so tem 2
        let nodes = ring.get_nodes("chunk_abc", 5);
        assert_eq!(nodes.len(), 2);
    }

    #[test]
    fn get_nodes_empty_ring_returns_empty() {
        let ring = HashRing::new();
        let nodes = ring.get_nodes("chunk_abc", 3);
        assert!(nodes.is_empty());
    }

    // -- Determinismo (ADR-006) --

    #[test]
    fn get_nodes_is_deterministic() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);
        ring.add_node(Uuid::from_u128(3), 100_000_000_000);

        let chunk_id = "deterministic_chunk";
        let nodes_a = ring.get_nodes(chunk_id, 3);
        let nodes_b = ring.get_nodes(chunk_id, 3);
        assert_eq!(nodes_a, nodes_b, "ADR-006: mesmo chunk = mesmos nos");
    }

    #[test]
    fn different_chunks_can_map_to_different_nodes() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);
        ring.add_node(Uuid::from_u128(3), 100_000_000_000);
        ring.add_node(Uuid::from_u128(4), 100_000_000_000);
        ring.add_node(Uuid::from_u128(5), 100_000_000_000);

        // Com 5 nos e muitos chunks, a distribuicao deve variar
        let mut first_nodes = std::collections::HashSet::new();
        for i in 0..100 {
            let nodes = ring.get_nodes(&format!("chunk_{i}"), 1);
            first_nodes.insert(nodes[0]);
        }
        assert!(first_nodes.len() > 1, "chunks diferentes devem mapear para nos diferentes");
    }

    // -- Distribuicao proporcional a capacidade (RF-013) --

    #[test]
    fn larger_capacity_node_receives_more_chunks() {
        let mut ring = HashRing::new();
        let small_node = Uuid::from_u128(1);
        let large_node = Uuid::from_u128(2);
        // large_node tem 10x a capacidade
        ring.add_node(small_node, 10_000_000_000);   // 10GB
        ring.add_node(large_node, 100_000_000_000);  // 100GB

        let mut small_count = 0u32;
        let mut large_count = 0u32;
        let total_chunks = 1000;

        for i in 0..total_chunks {
            let nodes = ring.get_nodes(&format!("chunk_{i}"), 1);
            if nodes[0] == small_node {
                small_count += 1;
            } else {
                large_count += 1;
            }
        }

        // Com 10x capacidade, large_node deve receber significativamente mais
        assert!(
            large_count > small_count * 3,
            "RF-013: no com 10x capacidade deve receber mais chunks (small={small_count}, large={large_count})"
        );
    }

    // -- Redistribuicao minima quando no entra/sai --

    #[test]
    fn adding_node_causes_minimal_redistribution() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);
        ring.add_node(Uuid::from_u128(3), 100_000_000_000);

        let total_chunks = 1000;
        let before: Vec<Vec<Uuid>> = (0..total_chunks)
            .map(|i| ring.get_nodes(&format!("chunk_{i}"), 1))
            .collect();

        // Adiciona 4o no
        ring.add_node(Uuid::from_u128(4), 100_000_000_000);

        let after: Vec<Vec<Uuid>> = (0..total_chunks)
            .map(|i| ring.get_nodes(&format!("chunk_{i}"), 1))
            .collect();

        let changed: usize = before.iter().zip(after.iter())
            .filter(|(b, a)| b[0] != a[0])
            .count();

        // Ideal: ~25% dos chunks migram (1/4). Toleramos ate 40%.
        let change_pct = (changed as f64 / total_chunks as f64) * 100.0;
        assert!(
            change_pct < 40.0,
            "redistribuicao deve ser minima: {changed}/{total_chunks} ({change_pct:.1}%) migraram"
        );
    }

    #[test]
    fn removing_node_causes_minimal_redistribution() {
        let mut ring = HashRing::new();
        ring.add_node(Uuid::from_u128(1), 100_000_000_000);
        ring.add_node(Uuid::from_u128(2), 100_000_000_000);
        ring.add_node(Uuid::from_u128(3), 100_000_000_000);
        ring.add_node(Uuid::from_u128(4), 100_000_000_000);

        let total_chunks = 1000;
        let before: Vec<Vec<Uuid>> = (0..total_chunks)
            .map(|i| ring.get_nodes(&format!("chunk_{i}"), 1))
            .collect();

        // Remove 1 no
        ring.remove_node(&Uuid::from_u128(4));

        let after: Vec<Vec<Uuid>> = (0..total_chunks)
            .map(|i| ring.get_nodes(&format!("chunk_{i}"), 1))
            .collect();

        let changed: usize = before.iter().zip(after.iter())
            .filter(|(b, a)| b[0] != a[0])
            .count();

        // Somente chunks do no removido devem migrar (~25%). Toleramos ate 40%.
        let change_pct = (changed as f64 / total_chunks as f64) * 100.0;
        assert!(
            change_pct < 40.0,
            "redistribuicao deve ser minima: {changed}/{total_chunks} ({change_pct:.1}%) migraram"
        );
    }
}
