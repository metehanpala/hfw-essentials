import { HttpClient } from "@angular/common/http";
import { Injectable, OnInit } from "@angular/core";
import { SystemsServiceBase } from "@gms-flex/services";
import { TranslateService } from "@ngx-translate/core";
import { cloneDeep } from 'lodash';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';

import { TableValue } from "../model/trend-export.model";
import { TrendExportMapperBaseService } from "./trend-export-mapper-base-service";
(window as any).pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Injectable()
export class TrendPdfExportService extends TrendExportMapperBaseService {

  constructor(protected readonly translateService: TranslateService, protected readonly systemsService: SystemsServiceBase) {
    super(translateService, systemsService);
  }

  public exportFile(): void {
    const filename = `${this.fileName}.${this.fileType}`;
    const documentDefinition: TDocumentDefinitions = this.createDocumentDefinition();
    try {
      pdfMake.createPdf(documentDefinition).download(filename);
    } catch (error) {
      throw new Error(`download: ${error.message}`);
    }
  }

  protected createPdfHeader(): Content {
    return {
      columns: [
        { image: this.logoUrl, width: 90, alignment: 'left', margin: [30, 8], fontSize: 12 },
        { text: this.trendReportTitle, alignment: 'center', fontSize: 14, bold: true, margin: [150, 20, 0, 10], width: '*' },
        { text: `${this.runAtText} ${this.formatDateToBrowserLocale(new Date().toISOString())}`, alignment: 'right', margin: [10, 10, 30, 0], fontSize: 10 }
      ]
    }
  }

  private createDocumentDefinition(): TDocumentDefinitions {
    try {
      return {
        header: this.createPdfHeader(),
        footer: (currentPage, pageCount) => this.createPdfFooter(currentPage, pageCount),
        content: this.createFileContent(),
        defaultStyle: { fontSize: 10 },
        styles: this.getPdfStyles(),
        pageMargins: [20, 60, 20, 60]
      };
    } catch (error) {
      throw new Error(`content: ${error.message}`);
    }
  }
  
  protected createPdfFooter(currentPage: number, pageCount: number): Content {
    return {
      text: this.pageText + ' ' + currentPage + ' ' + this.ofText + ' ' + pageCount,
      alignment: 'center',
      margin: [0, 20, 0, 10]
    };
  }

  protected createFileContent(): Content[] {
    const content: Content[] = [];
    content.push(this.createTableHeaders(this.peridTableLabel));
    content.push(this.createHeaderTable(this.dataToExport.sheetHeaders, this.dataToExport.sheetValues, 20, 
      this.getwidthForHeaderTables(this.dataToExport.sheetHeaders)));

    let contentCounter = 0;
    this.dataToExport.tableValues.forEach((tableValue, index) => {
      // set width of columns as per condition
      const dataWidths: string[] = this.calculateDynamicColumnWidths(tableValue.dataValues, tableValue.dataHeaders);
      if (tableValue.pointInfo) {
        content.push(this.createTableHeaders(this.pointInfoTableLebel));
        contentCounter++; 
        content.push(this.createHeaderTable(this.dataToExport.pointHeaders[0], tableValue.pointInfo, 0, 
          this.getwidthForHeaderTables(tableValue.pointInfo)));
        contentCounter++; 
      }
      if (tableValue.pointValues) {
        content.push(this.createHeaderTable(this.dataToExport.pointHeaders[1], tableValue.pointValues, 20,
          this.getwidthForHeaderTables(this.dataToExport.pointHeaders[1])));
        contentCounter++; 
      }
      // main point data table handling
      content.push(this.createTableHeaders(this.dataTableHeader));
      contentCounter++;
      content.push(this.createMainDataTable(tableValue, dataWidths));
      contentCounter++;
      // Add a page break after every 5 tables
      if (contentCounter % 5 === 0 && index !== this.dataToExport.tableValues.length - 1) {
        content.push({ text: '', pageBreak: 'after' });
      }
    });
    return content.map(contentObj => cloneDeep(contentObj))
  }

  private createTableHeaders(headerText: string): Content {
    return {
      table: {
        widths: ['*'],
        body: [[{ text: headerText, style: 'mainHeaderStyle' }]]
      },
      layout: 'noBorders'
    };
  }

  protected calculateDynamicColumnWidths(data: string [][], headers: string[]): string[] {
    const columnWidths: string[] = [];
    if (!data) {
      headers.forEach(() => columnWidths.push('*'));
      return columnWidths;
    }
    const numColumns = data[0].length;
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      let maxLength = 0;
    
      data.forEach(row => {
        const cell = row[colIndex];
        const cellLength = this.checkStringLength(cell)
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      if (maxLength < 5) {
        columnWidths.push('10%');
      } else if (maxLength < 10) {
        columnWidths.push('20%');
      } else if (maxLength > 60) {
        columnWidths.push('50%');
      } else {
        columnWidths.push('*');
      }
    }
    return columnWidths;
  }

  private createMainDataTable(tableValue, dataWidths: string[]): Content {
    const tableBody = [
      tableValue.dataHeaders.map(header => ({
        text: header,
        style: 'tableColHeader',
        alignment: this.getHeaderAlignment(header)
      })),
      ...this.getDataTableBody(tableValue)
    ];
    
    return {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: dataWidths,
        body: tableBody
      },
      layout: this.getTableLayout('fillcolor', tableValue.dataValues),
      margin: [0, 0, 0, 10]
    };
  }

  private getDataTableBody(tableValue: TableValue): Content[] {
    if (!tableValue.dataValues || tableValue.dataValues?.length === 0) {
      this.getNoDataMessageBody(tableValue);
    }

    return tableValue.dataValues.map(row => row.map(cell => this.createCell(cell, tableValue.resolution)));
  }

  private getNoDataMessageBody(tableValue: TableValue): any {
    return [[
      { 
        text: this.noDataAvailableText, 
        colSpan: tableValue.dataHeaders.length,
        alignment: 'center',
        margin: [0, 15, 0, 15]
      }
    ]];
  }

  private createHeaderTable(headers: string[], body: any[], tableMargin: number, widths: string[]): Content {
    const tableHeaders = headers.map(header => ({
      text: header,
      style: 'tableColHeader',
      colSpan: 1,
      alignment: this.getHeaderAlignment(header),
      margin: [1, 1, 5, 1],
      noWrap: false
    }));

    const tableBody = body.map(cell => 
      this.configureCell(cell, 'left', [1, 1, 5, 1])
    );

    return {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: widths,
        body: [tableHeaders, tableBody]
      },
      layout: this.getTableLayout('hBorder'),
      margin: [0, 0, 0, tableMargin]
    };
  }

  private createCell(cell: any, resolution: number): any {
    const cellType = this.checkStringType(cell);
  
    if (cellType === 'Number') {
      return this.configureCell(this.formatNumber(parseFloat(cell), resolution), 'right');
    } else if (cellType === 'Date') {
      return this.configureCell(this.formatDateToBrowserLocale(cell), 'left');
    } else {
      return this.configureCell(cell, 'right'); // Default for strings
    }
  }

  private configureCell(
    text: string | number,
    alignment: string,
    margin: number[] = [],
    colSpan: number = 1,
    noWrap: boolean = false
  ): any {
    return {
      text,
      alignment,
      colSpan,
      noWrap,
      ...(margin.length > 0 && { margin }) 
    };
  }

  private getHeaderAlignment(header: string): string {
    const rightAlignedHeaders = [this.minLabel, this.maxLabel, this.avgLabel, this.valueLabel];
    return rightAlignedHeaders.includes(header) ? 'right' : 'left';
  }

  private getTableLayout(layoutType: string, data: string[] = null): any {
    if (layoutType === 'hBorder') {
      return {
        defaultBorder: true,
        hLineColor: () => '#c7c7c7',
        vLineColor: () => '#c7c7c7'
      };
    }

    if (!data) {
      return {
        defaultBorder: true,
        hLineColor: () => '#c7c7c7',
        vLineColor: () => '#c7c7c7'
      };
    }
    
    return {
      fillColor: (rowIndex: number) => (rowIndex % 2 !== 0 ? '#e7e7e7' : null),
      defaultBorder: false
    };
  }

  private formatNumber(value: number, decimalPlaces: number = 0): string {
    return new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  }

  private checkStringLength(cell: string | number): number {
    if (cell == null) {
      return 0;
    }
    const cellLength = this.checkStringType(cell) === 'Number' 
      ? cell.toString().length
      : typeof cell === 'string' ? cell.length : 0;

    return cellLength;
  }

  private getPdfStyles(): any {
    return {
      tableColHeader: { bold: true, margin: [0, 1, 0, 1] },
      mainHeaderStyle: { fillColor: 'gray', color: 'white', bold: true, alignment: 'left', margin: [2, 1, 0, 1] }
    };
  }

  private getwidthForHeaderTables(cellArray): string[] {
    const widths = [];
    cellArray.forEach(item => {
      if (this.checkStringLength(item) > 70) {
        widths.push('75%');
      } else {
        widths.push('*');
      }
    });
    return widths;
  }
}
