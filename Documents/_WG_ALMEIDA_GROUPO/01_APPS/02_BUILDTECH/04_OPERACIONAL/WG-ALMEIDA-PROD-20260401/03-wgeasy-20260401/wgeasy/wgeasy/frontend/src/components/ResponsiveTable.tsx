import { useState, useMemo, useCallback, memo, useEffect } from "react";
import type { ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * Componente responsivo para tabelas
 * - Em desktop (≥768px): Tabela normal
 * - Em mobile (<768px): Cards empilhados verticalmente
 * - Suporta paginaçÍo, sorting e filtering
 */

export type Row = any;

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: Row) => ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean;
}

type SortOrder = "asc" | "desc" | null;

interface ResponsiveTableProps {
  data: Row[];
  columns: Column[];
  rowKey?: string;
  onRowClick?: (row: Row) => void;
  actions?: (row: Row) => ReactNode;
  className?: string;
  cardClassName?: string;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

/**
 * @example
 * <ResponsiveTable
 *   data={compras}
 *   columns={[
 *     { key: 'numero', label: 'Número', sortable: true },
 *     { key: 'valor', label: 'Valor', render: (v) => formatarValor(v), sortable: true },
 *     { key: 'status', label: 'Status' }
 *   ]}
 *   onRowClick={(row) => navigate(`/compras/${row.id}`)}
 *   pageSize={10}
 *   showPagination={true}
 *   enableSorting={true}
 *   enableFiltering={true}
 * />
 */
export function ResponsiveTable({
  data,
  columns,
  rowKey = "id",
  onRowClick,
  actions,
  className = "",
  cardClassName = "",
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  pageSize = 10,
  showPagination = true,
  enableSorting = true,
  enableFiltering = false,
}: ResponsiveTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [filters] = useState<Record<string, string>>({});

  // Aplicar filtros
  const filteredData = useMemo(() => {
    if (!enableFiltering || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter((row) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] || "").toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [data, filters, enableFiltering]);

  // Aplicar sorting
  const sortedData = useMemo(() => {
    if (!enableSorting || !sortColumn || !sortOrder) {
      return filteredData;
    }

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortOrder === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [filteredData, sortColumn, sortOrder, enableSorting]);

  // Resetar página ao filtrar ou ordenar
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedData]);

  // Calcular paginaçÍo baseada em dados ordenados e filtrados
  const { paginatedData, totalPages } = useMemo(() => {
    if (!showPagination || pageSize <= 0) {
      return { paginatedData: sortedData, totalPages: 1 };
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      paginatedData: sortedData.slice(start, end),
      totalPages: Math.ceil(sortedData.length / pageSize),
    };
  }, [sortedData, currentPage, pageSize, showPagination]);

  // Handle column sort (memoized to prevent unnecessary re-renders)
  const handleSort = useCallback((column: Column) => {
    if (!column.sortable || !enableSorting) return;

    if (sortColumn === column.key) {
      // Cycle: asc -> desc -> null
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column.key);
      setSortOrder("asc");
    }
  }, [enableSorting, sortColumn, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Componente de PaginaçÍo
  const PaginationControls = () => (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <div>
        Mostrando{" "}
        <span className="font-normal">
          {(currentPage - 1) * pageSize + 1}
        </span>{" "}
        a{" "}
        <span className="font-normal">
          {Math.min(currentPage * pageSize, sortedData.length)}
        </span>{" "}
        de <span className="font-normal">{sortedData.length}</span> registros
      </div>
      {showPagination && totalPages > 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2 py-1 rounded text-sm ${
                  currentPage === page
                    ? "bg-orange-600 text-white"
                    : "border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );

  // Componente memoizado para header da tabela
  const TableHeader = memo(() => (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        {columns.map((column) => (
          <th
            key={column.key}
            onClick={() => handleSort(column)}
            className={`
              px-4 py-3 text-left font-normal text-gray-700
              whitespace-nowrap
              ${column.className || ""}
              ${
                column.sortable && enableSorting
                  ? "cursor-pointer hover:bg-gray-100"
                  : ""
              }
            `}
            style={{ width: column.width }}
          >
            <div className="flex items-center gap-2">
              {column.label}
              {column.sortable && enableSorting && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {sortColumn === column.key && sortOrder === "asc" && (
                    <ChevronUp className="w-4 h-4 text-orange-600" />
                  )}
                  {sortColumn === column.key && sortOrder === "desc" && (
                    <ChevronDown className="w-4 h-4 text-orange-600" />
                  )}
                </div>
              )}
            </div>
          </th>
        ))}
        {actions && (
          <th className="px-4 py-3 text-right font-normal text-gray-700 whitespace-nowrap">
            Ações
          </th>
        )}
      </tr>
    </thead>
  ));
  TableHeader.displayName = "TableHeader";

  // MOBILE: Cards
  if (isMobile) {
    return (
      <div>
        <div className="space-y-3">
          {paginatedData.map((row) => (
            <div
              key={row[rowKey]}
              onClick={() => onRowClick?.(row)}
              className={`
              border border-gray-200 rounded-lg p-4
              bg-white hover:shadow-md transition-shadow
              cursor-pointer active:bg-gray-50
              ${cardClassName}
            `}
            >
              {/* Grid 2 colunas em mobile */}
              <div className="grid grid-cols-2 gap-4">
                {columns.map((column) => (
                  <div key={column.key} className="space-y-1">
                    <p className="text-xs font-normal text-gray-600">
                      {column.label}
                    </p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action hint */}
              {(onRowClick || actions) && (
                <div className="mt-3 text-xs text-gray-400 text-right">
                  Toque para abrir
                </div>
              )}

              {actions && <div className="mt-3 flex justify-end">{actions(row)}</div>}
            </div>
          ))}
        </div>
        {showPagination && totalPages > 1 && <PaginationControls />}
      </div>
    );
  }

  // DESKTOP: Tabela normal
  return (
    <div>
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full text-sm bg-white">
          <TableHeader />
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={() => onRowClick?.(row)}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${onRowClick ? "cursor-pointer" : ""}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.className || ""}`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPagination && totalPages > 1 && <PaginationControls />}
    </div>
  );
}

export default ResponsiveTable;

