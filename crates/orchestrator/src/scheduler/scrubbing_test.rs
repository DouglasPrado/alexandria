//! Testes para scrubbing — report e constantes.

#[cfg(test)]
mod tests {
    use crate::scheduler::scrubbing::ScrubReport;

    #[test]
    fn scrub_report_default_is_zero() {
        let report = ScrubReport::default();
        assert_eq!(report.verified, 0);
        assert_eq!(report.corrupted, 0);
        assert_eq!(report.repaired, 0);
    }

    #[test]
    fn scrub_report_tracks_all_outcomes() {
        let report = ScrubReport {
            verified: 1000,
            corrupted: 3,
            repaired: 2,
        };
        assert_eq!(report.verified, 1000);
        assert_eq!(report.corrupted, 3);
        assert_eq!(report.repaired, 2);
    }
}
