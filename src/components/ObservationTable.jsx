import { useMemo, useState } from 'react';
import { Tag } from '@blueprintjs/core';
import { Cell, Column, ColumnHeaderCell, SelectionModes, Table } from '@blueprintjs/table';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { buildObservationRows } from '../data/observations';

const COLUMNS = [
  { key: 'site', label: 'columnSite', width: 130 },
  { key: 'date', label: 'columnDate', width: 110 },
  { key: 'vv', label: 'columnVv', width: 82 },
  { key: 'vh', label: 'columnVh', width: 82 },
  { key: 'cross', label: 'columnCross', width: 100 },
  { key: 'water', label: 'columnWater', width: 76 },
  { key: 'change', label: 'columnChange', width: 80 },
  { key: 'recovery', label: 'columnRecovery', width: 94 },
  { key: 'status', label: 'columnStatus', width: 104 },
];

const STATUS_INTENT = {
  baseline: 'none',
  stable: 'success',
  recovery: 'warning',
  change: 'danger',
};

function formatDate(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function ObservationTable() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
  const [widths, setWidths] = useState(() =>
    Object.fromEntries(COLUMNS.map((column) => [column.key, column.width]))
  );
  const rows = useMemo(() => buildObservationRows(sites), [sites]);
  const isRtl = language === 'ar';
  const align = isRtl ? 'right' : 'left';

  // Blueprint's Table follows the container direction, so the same column
  // descriptors flow from the right in Arabic and from the left in English.
  const displayColumns = COLUMNS;
  const columnWidths = displayColumns.map((column) => widths[column.key]);

  const handleWidth = (displayIndex, width) => {
    const key = displayColumns[displayIndex]?.key;
    if (!key) return;
    setWidths((current) => ({ ...current, [key]: width }));
  };

  const header = (label) => (
    <ColumnHeaderCell
      name={label}
      style={{ textAlign: align }}
      nameRenderer={(name) => (
        <span className="table-header-label" style={{ textAlign: align }}>
          {name}
        </span>
      )}
    />
  );
  const siteCell = (row) => (
    <Cell style={{ textAlign: align }}>{localized(row.siteName, language)}</Cell>
  );
  const numericCell = (row, key, digits = 1) => (
    <Cell className="numeric" style={{ textAlign: align }}>
      {row[key] == null ? (
        '—'
      ) : (
        <span dir="ltr">{row[key].toFixed(digits)}</span>
      )}
    </Cell>
  );
  const percentCell = (row, key) => (
    <Cell className="numeric" style={{ textAlign: align }}>
      {row[key] == null ? '—' : <span dir="ltr">{`${Math.round(row[key] * 100)}%`}</span>}
    </Cell>
  );
  const recoveryCell = (row) => (
    <Cell className="numeric" style={{ textAlign: align }}>
      {row.recovery == null ? (
        '—'
      ) : (
        <>
          <span dir="ltr">{`${Math.round(row.recovery)}%`}</span>
          {row.projected ? ` · ${t('sites.observations.projectedShort')}` : ''}
        </>
      )}
    </Cell>
  );
  const statusCell = (row) => (
    <Cell style={{ textAlign: align }}>
      <Tag minimal intent={STATUS_INTENT[row.status]}>
        {t(`sites.observations.status.${row.status}`)}
      </Tag>
    </Cell>
  );

  const renderColumn = (column) => {
    const label = t(`sites.observations.${column.label}`);
    if (column.key === 'site') {
      return (
        <Column
          key={column.key}
          columnHeaderCellRenderer={() => header(label)}
          cellRenderer={(index) => siteCell(rows[index])}
        />
      );
    }
    if (column.key === 'date') {
      return (
        <Column
          key={column.key}
          columnHeaderCellRenderer={() => header(label)}
          cellRenderer={(index) => (
            <Cell style={{ textAlign: align }}>{formatDate(rows[index].date, language)}</Cell>
          )}
        />
      );
    }
    if (column.key === 'water' || column.key === 'change') {
      return (
        <Column
          key={column.key}
          columnHeaderCellRenderer={() => header(label)}
          cellRenderer={(index) => percentCell(rows[index], column.key)}
        />
      );
    }
    if (column.key === 'recovery') {
      return (
        <Column
          key={column.key}
          columnHeaderCellRenderer={() => header(label)}
          cellRenderer={(index) => recoveryCell(rows[index])}
        />
      );
    }
    if (column.key === 'status') {
      return (
        <Column
          key={column.key}
          columnHeaderCellRenderer={() => header(label)}
          cellRenderer={(index) => statusCell(rows[index])}
        />
      );
    }
    return (
      <Column
        key={column.key}
        columnHeaderCellRenderer={() => header(label)}
        cellRenderer={(index) => numericCell(rows[index], column.key)}
      />
    );
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="table-toolbar" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="row">
          <span className="micro">{t('sites.observations.title')}</span>
          <Tag minimal intent="primary" icon="database">
            {t('sites.illustrativeValues')}
          </Tag>
        </div>
        <div className="table-legend">
          {['baseline', 'stable', 'recovery', 'change'].map((status) => (
            <Tag key={status} minimal intent={STATUS_INTENT[status]}>
              {t(`sites.observations.status.${status}`)}
            </Tag>
          ))}
        </div>
      </div>

      <div
        className="table-shell"
        data-testid="measurements"
        dir={isRtl ? 'rtl' : 'ltr'}
        data-direction={isRtl ? 'rtl' : 'ltr'}
      >
        <Table
          className={`observations-table${isRtl ? ' observations-table--rtl' : ''}`}
          numRows={rows.length}
          columnWidths={columnWidths}
          onColumnWidthChanged={handleWidth}
          enableColumnResizing
          enableFocusedCell
          enableRowHeader={false}
          numFrozenColumns={isRtl ? 0 : 1}
          selectionModes={SelectionModes.CELLS}
          aria-label={t('sites.observations.title')}
        >
          {displayColumns.map(renderColumn)}
        </Table>
      </div>

      <p className="table-footnote">{t('sites.observations.note')}</p>
    </div>
  );
}
