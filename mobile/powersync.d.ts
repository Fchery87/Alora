/**
 * Dummy type declarations for PowerSync modules.
 * Remove this file after running:
 *   npx expo install @powersync/react-native @powersync/op-sqlite
 */
declare module "@powersync/react-native" {
  export const PowerSyncDatabase: any;
  export const UpdateType: any;
  export type AbstractPowerSyncDatabase = any;
  export type PowerSyncBackendConnector = any;
  export const column: any;
  export const Schema: any;
  export const Table: any;
}

declare module "@powersync/op-sqlite" {
  export const OPSqliteOpenFactory: any;
}
