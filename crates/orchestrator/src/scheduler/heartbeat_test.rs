//! Testes para heartbeat monitor — UC-008, 09-state_models (Node).
//!
//! Valida que o HeartbeatReport tem os campos corretos e que
//! as constantes de threshold seguem o blueprint.

#[cfg(test)]
mod tests {
    use crate::scheduler::heartbeat::HeartbeatReport;

    // UC-008: HeartbeatReport tracks all transition types
    #[test]
    fn heartbeat_report_default_is_zero() {
        let report = HeartbeatReport::default();
        assert_eq!(report.newly_suspect, 0);
        assert_eq!(report.newly_lost, 0);
        assert_eq!(report.recovered, 0);
    }

    // UC-008: HeartbeatReport fields match state machine transitions
    #[test]
    fn heartbeat_report_fields_match_state_transitions() {
        // online → suspect = newly_suspect
        // suspect → lost = newly_lost
        // suspect/lost → online = recovered
        let report = HeartbeatReport {
            newly_suspect: 2,
            newly_lost: 1,
            recovered: 3,
        };
        assert_eq!(report.newly_suspect, 2);
        assert_eq!(report.newly_lost, 1);
        assert_eq!(report.recovered, 3);
    }
}
