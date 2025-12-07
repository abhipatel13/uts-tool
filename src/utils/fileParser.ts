/**
 * File parsing utilities for CSV and Excel files
 * Supports header extraction, data parsing, and column auto-guessing
 */

import * as XLSX from 'xlsx';
import { AssetColumnMappings, AssetFieldDefinition } from '@/types';

// ============================================================================
// Asset Field Definitions with Auto-Guess Aliases
// ============================================================================

export const ASSET_FIELD_DEFINITIONS: AssetFieldDefinition[] = [
  // Required fields (shown first with emphasis)
  {
    key: 'id',
    label: 'ID (Unique Identifier)',
    required: true,
    aliases: ['id', 'asset_id', 'asset id', 'assetid', 'unique_id', 'unique id', 'identifier'],
  },
  {
    key: 'name',
    label: 'Name',
    required: true,
    aliases: ['name', 'asset_name', 'asset name', 'assetname', 'title', 'asset_title'],
  },
  // Optional fields
  {
    key: 'parent_id',
    label: 'Parent ID',
    required: false,
    aliases: ['parent_id', 'parent id', 'parentid', 'parent', 'parent_asset', 'parent asset'],
  },
  {
    key: 'description',
    label: 'Description',
    required: false,
    aliases: ['description', 'desc', 'asset_description', 'details'],
  },
  {
    key: 'cmms_internal_id',
    label: 'CMMS Internal ID',
    required: false,
    aliases: ['cmms_internal_id', 'cmms internal id', 'cmms_id', 'cmms id', 'cmmsid', 'internal_id'],
  },
  {
    key: 'functional_location',
    label: 'Functional Location',
    required: false,
    aliases: ['functional_location', 'functional location', 'func_loc', 'func loc', 'floc', 'location'],
  },
  {
    key: 'functional_location_desc',
    label: 'Functional Location Description',
    required: false,
    aliases: ['functional_location_desc', 'functional location desc', 'func_loc_desc', 'floc_desc', 'location_desc'],
  },
  {
    key: 'functional_location_long_desc',
    label: 'Functional Location Long Description',
    required: false,
    aliases: ['functional_location_long_desc', 'functional location long desc', 'func_loc_long_desc', 'floc_long_desc', 'long_desc', 'long description'],
  },
  {
    key: 'maintenance_plant',
    label: 'Maintenance Plant',
    required: false,
    aliases: ['maintenance_plant', 'maintenance plant', 'maint_plant', 'plant', 'facility'],
  },
  {
    key: 'cmms_system',
    label: 'CMMS System',
    required: false,
    aliases: ['cmms_system', 'cmms system', 'system', 'cmms'],
  },
  {
    key: 'object_type',
    label: 'Object Type',
    required: false,
    aliases: ['object_type', 'object type', 'type', 'asset_type', 'asset type', 'category', 'taxonomy'],
  },
  {
    key: 'system_status',
    label: 'System Status',
    required: false,
    aliases: ['system_status', 'system status', 'status', 'asset_status', 'state'],
  },
  {
    key: 'make',
    label: 'Make',
    required: false,
    aliases: ['make', 'brand', 'model'],
  },
  {
    key: 'manufacturer',
    label: 'Manufacturer',
    required: false,
    aliases: ['manufacturer', 'mfg', 'mfr', 'vendor', 'supplier'],
  },
  {
    key: 'serial_number',
    label: 'Serial Number',
    required: false,
    aliases: ['serial_number', 'serial number', 'serialnumber', 'serial', 'serial_no', 'sn'],
  },
];

// ============================================================================
// CSV Parsing (Custom parser matching bulk-upload pattern)
// ============================================================================

/**
 * Parse CSV text and extract headers from the first row
 */
export function extractCSVHeaders(text: string): string[] {
  const firstLine = text.split(/\r?\n/)[0] || '';
  return parseCSVRow(firstLine);
}

/**
 * Parse a single CSV row, handling quoted fields and escaped quotes
 */
function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  cells.push(current.trim());
  return cells;
}

/**
 * Parse full CSV content into rows of data
 */
export function parseCSVData(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }
    
    // If we're not in quotes, end the row
    if (!inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      // Continue to next line (newline within quotes)
      currentCell += '\n';
    }
  }
  
  // Handle any remaining content
  if (currentRow.length > 0 || currentCell !== '') {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// ============================================================================
// Excel Parsing (using xlsx library)
// ============================================================================

/**
 * Parse Excel file and extract headers from the first row
 */
export async function extractExcelHeaders(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  
  if (data.length === 0) return [];
  return (data[0] || []).map(cell => String(cell ?? '').trim());
}

/**
 * Parse full Excel file into rows of data
 */
export async function parseExcelData(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  
  // Convert all cells to strings and filter empty rows
  return data
    .map(row => (row || []).map(cell => String(cell ?? '').trim()))
    .filter(row => row.some(cell => cell !== ''));
}

// ============================================================================
// Unified File Parsing
// ============================================================================

/**
 * Detect file type from extension
 */
export function getFileType(file: File): 'csv' | 'excel' | 'unknown' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
  return 'unknown';
}

/**
 * Extract headers from a file (CSV or Excel)
 */
export async function extractFileHeaders(file: File): Promise<string[]> {
  const fileType = getFileType(file);
  
  if (fileType === 'csv') {
    const text = await file.text();
    return extractCSVHeaders(text);
  } else if (fileType === 'excel') {
    return extractExcelHeaders(file);
  }
  
  throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
}

/**
 * Parse full file data (CSV or Excel)
 */
export async function parseFileData(file: File): Promise<string[][]> {
  const fileType = getFileType(file);
  
  if (fileType === 'csv') {
    const text = await file.text();
    return parseCSVData(text);
  } else if (fileType === 'excel') {
    return parseExcelData(file);
  }
  
  throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
}

// ============================================================================
// Auto-Guess Column Mappings
// ============================================================================

/**
 * Auto-guess column mappings based on header names
 */
export function autoGuessColumnMappings(headers: string[]): Partial<AssetColumnMappings> {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const mappings: Partial<AssetColumnMappings> = {};

  for (const field of ASSET_FIELD_DEFINITIONS) {
    const matchIndex = normalizedHeaders.findIndex(h => field.aliases.includes(h));
    if (matchIndex >= 0) {
      mappings[field.key] = headers[matchIndex];
    }
  }

  return mappings;
}

// ============================================================================
// ID Uniqueness Validation
// ============================================================================

export interface DuplicateIdInfo {
  value: string;
  rows: number[];  // 1-based row numbers (excluding header)
}

/**
 * Check for duplicate IDs in the data
 * Returns list of duplicates with their row numbers
 */
export function findDuplicateIds(
  data: string[][],
  headers: string[],
  idColumnHeader: string
): DuplicateIdInfo[] {
  const idColumnIndex = headers.findIndex(h => h === idColumnHeader);
  if (idColumnIndex < 0) return [];

  const idOccurrences = new Map<string, number[]>();

  // Start from row 1 (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idValue = row[idColumnIndex]?.trim() || '';
    
    if (idValue === '') continue;

    const existing = idOccurrences.get(idValue) || [];
    existing.push(i + 1); // 1-based row number for user display
    idOccurrences.set(idValue, existing);
  }

  // Filter to only duplicates (more than one occurrence)
  const duplicates: DuplicateIdInfo[] = [];
  for (const [value, rows] of idOccurrences) {
    if (rows.length > 1) {
      duplicates.push({ value, rows });
    }
  }

  return duplicates;
}

