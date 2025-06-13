import { Injectable, OnInit } from "@angular/core";
import { SystemsServiceBase } from "@gms-flex/services";
import { TranslateService } from "@ngx-translate/core";
import { Borders, Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';

import { TrendExportMapperBaseService } from "./trend-export-mapper-base-service";

@Injectable()
export class TrendExcelExportService extends TrendExportMapperBaseService {
  private readonly mergedRanges: string[] = [];

  constructor(protected readonly translateService: TranslateService, protected readonly systemsService: SystemsServiceBase) {
    super(translateService, systemsService);
  }

  public exportFile(): void {
    const filename = `${this.fileName}.${this.fileType}`;
    const contentType = this.fileType === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv;charset=utf-8;';
    const workbook = this.createFileContent();
    
    try {
      if (this.fileType === 'csv') {
        this.exportToCsv(workbook, filename, contentType);
      } else {
        this.exportToExcel(workbook, filename, contentType);
      }
    } catch (error) {
      throw new Error(`download: ${error.message}`);
    }
  }
  
  private exportToExcel(workbook: Workbook, filename: string, contentType: string): void {
    workbook[this.fileType].writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: contentType });
      fs.saveAs(blob, filename);
    });
  }

  private exportToCsv(workbook: Workbook, filename: string, contentType: string): void {
    let combinedCSV = '';

    workbook.worksheets.forEach(worksheet => {
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const rowData = this.processRowForCsv(row, worksheet, rowNumber);
        combinedCSV += rowData + '\n';
      });
      combinedCSV += '\n'; // Add a blank line between sheets
    });

    const csvBlob = new Blob([combinedCSV], { type: contentType });
    fs.saveAs(csvBlob, filename);
  }

  private processRowForCsv(row: any, worksheet: Worksheet, rowNumber: number): string {
    return Array.isArray(row.values)
      ? row.values
        .slice(1) // Skip the first element (ExcelJS uses 1-based indexing)
        .map((cell, colIndex) => this.processCellForCsv(cell, worksheet, rowNumber, colIndex))
        .join(',')
      : '';
  }

  private processCellForCsv(cell: any, worksheet: Worksheet, rowNumber: number, colIndex: number): string {
    const isMergedCell = this.isCellInMergedRange(worksheet, rowNumber, colIndex + 1);
    if (isMergedCell) {
      const startCell = this.getStartCellOfMergedRange(worksheet, rowNumber, colIndex + 1);
      return colIndex + 1 === startCell.col ? startCell.value?.toString() ?? '' : '';
    }

    let cellValue = cell?.toString() ?? '';
    if (cellValue.includes(',')) {
      cellValue = `"${cellValue.replace(/"/g, '""')}"`;
    }
    return cellValue;
  }

  private isCellInMergedRange(worksheet: Worksheet, row: number, col: number): boolean {
    return this.mergedRanges.some(range => {
      const [start, end] = range.split(':');
      const startCell = worksheet.getCell(start);
      const endCell = worksheet.getCell(end);
      return (
        row >= Number(startCell.row) &&
        row <= Number(endCell.row) &&
        col >= Number(startCell.col) &&
        col <= Number(endCell.col)
      );
    });
  }

  private getStartCellOfMergedRange(worksheet: Worksheet, row: number, col: number): any {
    const range = this.mergedRanges.find(rangeVal => {
      const [start, end] = rangeVal.split(':');
      const startCell = worksheet.getCell(start);
      const endCell = worksheet.getCell(end);
      return (
        row >= Number(startCell.row) &&
        row <= Number(endCell.row) &&
        col >= Number(startCell.col) &&
        col <= Number(endCell.col)
      );
    });
    const [start] = range.split(':');
    return worksheet.getCell(start);
  }

  protected createFileContent(): Workbook {
    const workbook = new Workbook();
    const thinBorder: Partial<Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
      
    try {
      let startColumn = 1;
      const startRow = 1;
  
      this.dataToExport.tableValues.forEach(table => {
        const worksheet = workbook.addWorksheet(table.pointValues[1]);
  
        // Merge cells for the first header
        this.addMergedHeader(
          worksheet,
          startRow,
          startColumn,
          this.dataToExport.sheetHeaders.length,
          this.peridTableLabel,
          thinBorder
        ); 
  
        this.addHeaders(worksheet, this.dataToExport.sheetHeaders, startRow + 1, startColumn, thinBorder);
        this.addDataValues(worksheet, [this.dataToExport.sheetValues], startRow + 2, startColumn, thinBorder);
  
        // Merge cells for the second header
        this.addMergedHeader(
          worksheet,
          startRow + 4,
          startColumn,
          this.dataToExport.pointHeaders[1].length,
          this.pointInfoTableLebel,
          thinBorder
        );
  
        this.addHeaders(worksheet, this.dataToExport.pointHeaders[0], startRow + 5, startColumn, thinBorder);
        this.addDataPointInfo(worksheet, [table.pointInfo], startRow + 6, startColumn, thinBorder);
        this.addHeaders(worksheet, this.dataToExport.pointHeaders[1], startRow + 7, startColumn, thinBorder);
        this.addDataPointInfo(worksheet, [table.pointValues], startRow + 8, startColumn, thinBorder);
  
        // Merge cells for the main data table header
        this.addMergedHeader(
          worksheet,
          startRow + 10,
          startColumn,
          table.dataHeaders.length,
          this.dataTableHeader,
          thinBorder
        );
  
        this.addHeaders(worksheet, table.dataHeaders, startRow + 11, startColumn, thinBorder);
        this.addDataValues(worksheet, table.dataValues, startRow + 12, startColumn, thinBorder, table.resolution, table.dataHeaders);
  
        startColumn = 1;
        this.adjustColumnWidths(worksheet);
      });
    } catch (error) {
      throw new Error(`content: ${error.message}`);
    }
    return workbook;
  }

  private addMergedHeader(
    worksheet: Worksheet,
    row: number,
    startColumn: number,
    columnSpan: number,
    headerText: string,
    border: Partial<Borders>
  ): void {
    const startColumnLetter = worksheet.getColumn(startColumn).letter;
    const endColumnLetter = worksheet.getColumn(startColumn + columnSpan - 1).letter;
    const range = `${startColumnLetter}${row}:${endColumnLetter}${row}`;
    if (!worksheet.getCell(row, startColumn).isMerged) {
      worksheet.mergeCells(row, startColumn, row, startColumn + columnSpan - 1);
      this.mergedRanges.push(range); // Track the merged range
    }

    const cell = worksheet.getCell(row, startColumn);
    cell.value = headerText;
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF356287' } };
    cell.border = border;
    worksheet.getRow(row).height = 25;
  }

  protected calculateDynamicColumnWidths(data: (string | number)[][], headers: string[]): string[] {
    throw new Error("Method not implemented.");
  }

  private adjustColumnWidths(worksheet: Worksheet): void {
    worksheet.eachRow(row => {
      row.eachCell((cell, colNumber) => {
        const column = worksheet.getColumn(colNumber);
        const cellValue = cell.value ? cell.value.toString() : "";
        column.width = Math.max(column.width || 10, cellValue.length + 1);
      });
    });
  }

  private addHeaders(worksheet: Worksheet, headers: string[], startRow: number, startColumn: number, border: Partial<Borders>): void {
    headers.forEach((header: string, colIndex: number) => {
      const cell = worksheet.getCell(startRow, startColumn + colIndex);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCDCDC' }
      };
      cell.border = border;
    });
  }

  private addDataValues(worksheet: Worksheet, dataValues: string[][], startRow: number, startColumn: number, 
    border: Partial<Borders>, _resolution: number = 0, dataHeaders: string[] = []): void {
    // If there is no data available, display a message in the first cell
    if (dataValues == null || dataValues.length === 0 || dataValues.every(row => row.every(cell => !cell))) {
      const numColumns = dataHeaders.length; 
      const endColumn = startColumn + numColumns - 1; 
      worksheet.mergeCells(startRow, startColumn, startRow, endColumn);
      const cell = worksheet.getCell(startRow, startColumn);
      cell.value = this.noDataAvailableText;
      cell.border = border;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { bold: true }; 
    } else {
      dataValues.forEach((row: string[], rowIndex: number) => {
        row.forEach((value, colIndex) => {
          const cell = worksheet.getCell(startRow + rowIndex, startColumn + colIndex);
          const val = this.checkStringType(value)
          if (val == 'Number') {
            const [cellValue, excelFormatString] = this.getFormattedDecimalValue(value, _resolution);
            cell.value = cellValue;
            cell.numFmt = excelFormatString;
          } else if (val == 'Date') {
            cell.value = this.formatDateToBrowserLocale(value);
            cell.numFmt = this.getExcelDateFormat(value);
          } else {
            cell.value = value;
          }
          cell.border = border;
        });
      });
    }
  }

  private addDataPointInfo(worksheet: Worksheet, dataValues: string[][], startRow: number, startColumn: number, border: Partial<Borders>, 
    _resolution: number = 0): void {
    dataValues.forEach((row: string[], rowIndex: number) => {
      row.forEach((value, colIndex) => {
        const cell = worksheet.getCell(startRow + rowIndex, startColumn + colIndex);
        cell.value = value;
        cell.border = border;
      });
    });
  }

  private getFormattedDecimalValue(cellValue: string, resolution: number): [number, string] {
    const parsedValue = parseFloat(cellValue);
    const formatString = this.generateExcelFormatString(this.locale, resolution);
    return [parsedValue, formatString];
  }

  private generateExcelFormatString(locale: string, decimalDigits: number): string {
    const numberFormatter = new Intl.NumberFormat(locale);

    const groupSeparator = numberFormatter.formatToParts(12345).find(part => part.type === 'group')?.value || '';
    const decimalSeparator = numberFormatter.formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';

    let formatString = "#,##0";

    if (decimalDigits > 0) {
      formatString += decimalSeparator + new Array(decimalDigits + 1).join('0');
    }
    if (groupSeparator) {
      formatString = formatString.replace(',', groupSeparator);
    }
    return formatString;
  }

  private getExcelDateFormat(date: string): string {
    const formattedDate = this.formatDateToBrowserLocale(date);
    const is12HourFormat = formattedDate.includes('AM') || formattedDate.includes('PM');
    let dateFormat = '';
    if (formattedDate.includes('/')) {
      dateFormat = 'mm/dd/yyyy';
    } else if (formattedDate.includes('.')) {
      dateFormat = 'dd.mm.yyyy';
    } else if (formattedDate.includes('-')) {
      dateFormat = 'yyyy-mm-dd';
    }

    if (is12HourFormat) {
      dateFormat += ', hh:mm AM/PM';
    } else {
      dateFormat += ', HH:mm';
    }
    return dateFormat;
  }
}
