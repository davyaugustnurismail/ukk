import React from 'react';
import PesertaHeader from '../Controls/PesertaHeader';
import PesertaFilters from '../Controls/PesertaFilters';
import PesertaTable from '../PesertaTable';

interface Props {
  activityId: string;
  panitia: any[];
  panitiaLoading: boolean;
  certificatesGenerated: boolean;
  panitiaSelectedIds: Array<string | number>;
  globalSelectedIds?: Array<string | number>;
  selectAllUsers?: boolean;
  hasPesertaSelected?: boolean;
  totalAllRoles?: number;
  currentRole?: 'Peserta' | 'Panitia' | 'Narasumber';
  openAddImportChooser: () => void;
  onBulkDeleteClick: () => void;
  onBulkEmailClick: () => void;
  onGenerateClick: () => void;
  isGenerating: boolean;
  statusFilter: any;
  onStatusChange: (v: any) => void;
  panitiaSearch: string;
  setPanitiaSearch: (v: string) => void;
  panitiaItemsPerPage: number;
  setPanitiaItemsPerPage: (v: number) => void;
  panitiaTotalPages: number;
  panitiaCurrentPage: number;
  setPanitiaCurrentPage: (v: number) => void;
  filteredPanitia: any[];
  visiblePanitia: any[];
  panitiaIsSelected: (id: string | number) => boolean;
  panitiaToggleSelect: (id: string | number) => void;
  panitiaToggleSelectAll: () => void;
  panitiaSendingIds: Array<string | number>;
  onSelectAllEverything?: () => void;
  userId: number | null;
  instruktur: string | null;
  sendEmailSingle: (p: any) => void;
  openEditModal: (p: any) => void;
  setDeleteConfirmation: (p: any) => void;
}

export default function PanitiaTab(props: Props) {
  return (
    <>
      <PesertaHeader
        totalPeserta={props.panitia.length}
        totalAllRoles={props.totalAllRoles}
        currentRole={props.currentRole ?? 'Panitia'}
        loading={props.panitiaLoading}
        certificatesGenerated={props.certificatesGenerated}
        selectedIds={props.selectAllUsers ? props.globalSelectedIds || [] : props.panitiaSelectedIds}
        hasPesertaSelected={props.hasPesertaSelected}
        onAddImportClick={props.openAddImportChooser}
        onBulkDeleteClick={props.onBulkDeleteClick}
        onBulkEmailClick={props.onBulkEmailClick}
        onGenerateClick={props.onGenerateClick}
        isGenerating={props.isGenerating}
        statusFilter={props.statusFilter}
        onStatusChange={props.onStatusChange}
        onSelectAllEverything={props.onSelectAllEverything}
      />

      <PesertaFilters
        pesertaSearch={props.panitiaSearch}
        onSearchChange={props.setPanitiaSearch}
        itemsPerPage={props.panitiaItemsPerPage}
        onItemsPerPageChange={(v) => { props.setPanitiaItemsPerPage(v); props.setPanitiaCurrentPage(1); }}
        totalPages={props.panitiaTotalPages}
        currentPage={props.panitiaCurrentPage}
        onPageChange={props.setPanitiaCurrentPage}
      />

      <PesertaTable
        loading={props.panitiaLoading}
        peserta={props.panitia}
        filteredPeserta={props.filteredPanitia}
        visiblePeserta={props.visiblePanitia}
        currentPage={props.panitiaCurrentPage}
        itemsPerPage={props.panitiaItemsPerPage}
        isSelected={props.panitiaIsSelected}
        toggleSelect={props.panitiaToggleSelect}
        toggleSelectAll={props.panitiaToggleSelectAll}
        sendingIds={props.panitiaSendingIds}
        certificatesGenerated={props.certificatesGenerated}
        userId={props.userId}
        instruktur={props.instruktur}
        activityId={props.activityId}
        memberRole="panitia"
        onSendEmail={(p: any) => props.sendEmailSingle(p)}
        onEdit={(p: any) => props.openEditModal(p)}
        onDelete={(p: any) => props.setDeleteConfirmation(p)}
      />
    </>
  );
}
