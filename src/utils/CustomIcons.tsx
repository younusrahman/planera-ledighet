import type { JSX } from "react";
import absenceIcon from "./attendance.svg";
import absenceTypeIcon from "./absenceTypeIcon.svg";
import databaseTable from "./databaseTable.svg";
import databaseConfiguration from "./databaseConfiguration.svg";
import configuration from "./configuration.svg";
import dataReport from "./dataReport.svg";



export const TeamIcon: JSX.Element = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="black"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
export const EmployeeIcon: JSX.Element = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="black"
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const AbsenceIcon: JSX.Element = (
  <img src={absenceIcon} alt="Frånvaroikon" width={24} height={24} />
);

export const AbsenceTypeIcon: JSX.Element = (
  <img src={absenceTypeIcon} alt="Frånvarotypikon" width={24} height={24} />
);

export const DatabaseTableIcon: JSX.Element = (
  <img src={databaseTable} alt="Databasikon" width={24} height={24} />
);

export const DatabaseConfigurationIcon: JSX.Element = (
  <img src={databaseConfiguration} alt="Databaskonfigurationsikon" width={24} height={24} />
);

export const ConfigurationIcon: JSX.Element = (
  <img src={configuration} alt="Konfigurationsikon" width={24} height={24} />
);

export const DataReportIcon: JSX.Element = (
  <img src={dataReport} alt="Data- och rapporteringsikon" width={24} height={24} />
);