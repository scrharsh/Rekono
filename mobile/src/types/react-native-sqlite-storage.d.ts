/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    executeSql(sql: string, params?: any[]): Promise<[ResultSet]>;
    close(): Promise<void>;
  }

  export interface ResultSet {
    rows: {
      length: number;
      item(index: number): any;
      raw(): any[];
    };
    rowsAffected: number;
    insertId?: number;
  }

  export function openDatabase(options: {
    name: string;
    location?: string;
    createFromLocation?: string;
  }): Promise<SQLiteDatabase>;

  export function enablePromise(enable: boolean): void;
}
