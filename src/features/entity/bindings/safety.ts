import * as safetySlice from '@/store/slices/safetySlice';
import { EntityRef } from '@/features/entity/entity';

// Safety selectors and thunks per entity kind and dataset.
export const SAFETY = {
  school: {
    data: {
      truancy: safetySlice.selectSchoolTruancyData,
      safety: safetySlice.selectSchoolSafetyData,
      harassment: safetySlice.selectSchoolHarassmentData,
      seclusion: safetySlice.selectSchoolSeclusionData,
      restraint: safetySlice.selectSchoolRestraintData,
      bullying: safetySlice.selectSchoolBullyingData,
      bullyingClassification: safetySlice.selectSchoolBullyingClassificationData,
      bullyingImpact: safetySlice.selectSchoolBullyingImpactData,
      disciplineCount: safetySlice.selectSchoolDisciplineCountData,
      disciplineIncident: safetySlice.selectSchoolDisciplineIncidentData,
      enrollment: safetySlice.selectSchoolEnrollmentData
    },
    loading: {
      truancy: safetySlice.selectSchoolTruancyLoadingStatus,
      safety: safetySlice.selectSchoolSafetyIncidentsLoadingStatus,
      harassment: safetySlice.selectSchoolHarassmentIncidentsLoadingStatus,
      seclusion: safetySlice.selectSchoolSeclusionLoadingStatus,
      restraint: safetySlice.selectSchoolRestraintLoadingStatus,
      bullying: safetySlice.selectSchoolBullyingIncidentsLoadingStatus,
      bullyingClassification: safetySlice.selectSchoolBullyingClassificationsLoadingStatus,
      bullyingImpact: safetySlice.selectSchoolBullyingImpactsLoadingStatus,
      disciplineCount: safetySlice.selectSchoolDisciplineCountsLoadingStatus,
      disciplineIncident: safetySlice.selectSchoolDisciplineIncidentsLoadingStatus,
      enrollment: safetySlice.selectSchoolEnrollmentLoadingStatus
    },
    fetch: {
      truancy: safetySlice.fetchSchoolTruancyData,
      safety: safetySlice.fetchSchoolSafetyIncidents,
      harassment: safetySlice.fetchSchoolHarassmentIncidents,
      seclusion: safetySlice.fetchSchoolSeclusions,
      restraint: safetySlice.fetchSchoolRestraints,
      bullying: safetySlice.fetchSchoolBullyingIncidents,
      bullyingClassification: safetySlice.fetchSchoolBullyingClassifications,
      bullyingImpact: safetySlice.fetchSchoolBullyingImpacts,
      disciplineCount: safetySlice.fetchSchoolDisciplineCounts,
      disciplineIncident: safetySlice.fetchSchoolDisciplineIncidents,
      enrollment: safetySlice.fetchSchoolEnrollmentData
    }
  },
  district: {
    data: {
      truancy: safetySlice.selectDistrictTruancyData,
      safety: safetySlice.selectDistrictSafetyData,
      harassment: safetySlice.selectDistrictHarassmentData,
      seclusion: safetySlice.selectDistrictSeclusionData,
      restraint: safetySlice.selectDistrictRestraintData,
      bullying: safetySlice.selectDistrictBullyingData,
      bullyingClassification: safetySlice.selectDistrictBullyingClassificationData,
      bullyingImpact: safetySlice.selectDistrictBullyingImpactData,
      disciplineCount: safetySlice.selectDistrictDisciplineCountData,
      disciplineIncident: safetySlice.selectDistrictDisciplineIncidentData,
      enrollment: safetySlice.selectDistrictEnrollmentData
    },
    loading: {
      truancy: safetySlice.selectDistrictTruancyLoadingStatus,
      safety: safetySlice.selectDistrictSafetyIncidentsLoadingStatus,
      harassment: safetySlice.selectDistrictHarassmentIncidentsLoadingStatus,
      seclusion: safetySlice.selectDistrictSeclusionLoadingStatus,
      restraint: safetySlice.selectDistrictRestraintLoadingStatus,
      bullying: safetySlice.selectDistrictBullyingIncidentsLoadingStatus,
      bullyingClassification: safetySlice.selectDistrictBullyingClassificationsLoadingStatus,
      bullyingImpact: safetySlice.selectDistrictBullyingImpactsLoadingStatus,
      disciplineCount: safetySlice.selectDistrictDisciplineCountsLoadingStatus,
      disciplineIncident: safetySlice.selectDistrictDisciplineIncidentsLoadingStatus,
      enrollment: safetySlice.selectDistrictEnrollmentLoadingStatus
    },
    fetch: {
      truancy: safetySlice.fetchDistrictTruancyData,
      safety: safetySlice.fetchDistrictSafetyIncidents,
      harassment: safetySlice.fetchDistrictHarassmentIncidents,
      seclusion: safetySlice.fetchDistrictSeclusions,
      restraint: safetySlice.fetchDistrictRestraints,
      bullying: safetySlice.fetchDistrictBullyingIncidents,
      bullyingClassification: safetySlice.fetchDistrictBullyingClassifications,
      bullyingImpact: safetySlice.fetchDistrictBullyingImpacts,
      disciplineCount: safetySlice.fetchDistrictDisciplineCounts,
      disciplineIncident: safetySlice.fetchDistrictDisciplineIncidents,
      enrollment: safetySlice.fetchDistrictEnrollmentData
    }
  }
} as const;

export const STATE_SAFETY = {
  data: {
    truancy: safetySlice.selectStateTruancyData,
    safety: safetySlice.selectStateSafetyData,
    harassment: safetySlice.selectStateHarassmentData,
    seclusion: safetySlice.selectStateSeclusionData,
    restraint: safetySlice.selectStateRestraintData,
    bullying: safetySlice.selectStateBullyingData,
    bullyingClassification: safetySlice.selectStateBullyingClassificationData,
    bullyingImpact: safetySlice.selectStateBullyingImpactData,
    disciplineCount: safetySlice.selectStateDisciplineCountData,
    disciplineIncident: safetySlice.selectStateDisciplineIncidentData,
    enrollment: safetySlice.selectStateEnrollmentData
  },
  loading: {
    truancy: safetySlice.selectStateTruancyLoadingStatus,
    safety: safetySlice.selectStateSafetyIncidentsLoadingStatus,
    harassment: safetySlice.selectStateHarassmentIncidentsLoadingStatus,
    seclusion: safetySlice.selectStateSeclusionLoadingStatus,
    restraint: safetySlice.selectStateRestraintLoadingStatus,
    bullying: safetySlice.selectStateBullyingIncidentsLoadingStatus,
    bullyingClassification: safetySlice.selectStateBullyingClassificationsLoadingStatus,
    bullyingImpact: safetySlice.selectStateBullyingImpactsLoadingStatus,
    disciplineCount: safetySlice.selectStateDisciplineCountsLoadingStatus,
    disciplineIncident: safetySlice.selectStateDisciplineIncidentsLoadingStatus,
    enrollment: safetySlice.selectStateEnrollmentLoadingStatus
  },
  fetch: {
    truancy: safetySlice.fetchStateTruancyData,
    safety: safetySlice.fetchStateSafetyIncidents,
    harassment: safetySlice.fetchStateHarassmentIncidents,
    seclusion: safetySlice.fetchStateSeclusions,
    restraint: safetySlice.fetchStateRestraints,
    bullying: safetySlice.fetchStateBullyingIncidents,
    bullyingClassification: safetySlice.fetchStateBullyingClassifications,
    bullyingImpact: safetySlice.fetchStateBullyingImpacts,
    disciplineCount: safetySlice.fetchStateDisciplineCounts,
    disciplineIncident: safetySlice.fetchStateDisciplineIncidents,
    enrollment: safetySlice.fetchStateEnrollmentData
  }
} as const;

export type SafetyDataset = keyof typeof STATE_SAFETY.data;

// How a component falls back when the entity is not loaded yet:
// 'zero' reproduces `entity?.id || 0`, 'none' reproduces `entity?.id`.
// Each shared component keeps its current per-kind value.
export type IdFallback = 'zero' | 'none';

export const safetyParams = (entity: EntityRef, fallback: IdFallback) => {
  const id = fallback === 'zero' ? (entity.id || 0) : entity.id;
  return entity.kind === 'school' ? { school_id: id } : { district_id: id };
};
