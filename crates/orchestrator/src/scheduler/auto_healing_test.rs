//! Testes para auto_healing — replicacao minima e report.

#[cfg(test)]
mod tests {
    use crate::scheduler::auto_healing::HealingReport;

    // Auto-healing report default is zero (no lost nodes)
    #[test]
    fn healing_report_default_is_zero() {
        let report = HealingReport::default();
        assert_eq!(report.lost_nodes, 0);
        assert_eq!(report.under_replicated_chunks, 0);
    }

    // Auto-healing tracks both lost nodes and under-replicated chunks
    #[test]
    fn healing_report_tracks_lost_and_under_replicated() {
        let report = HealingReport {
            lost_nodes: 2,
            under_replicated_chunks: 15,
        };
        assert_eq!(report.lost_nodes, 2);
        assert_eq!(report.under_replicated_chunks, 15);
    }
}
