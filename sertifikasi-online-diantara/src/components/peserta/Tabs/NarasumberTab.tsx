import React from 'react';
import PesertaHeader from '../Controls/PesertaHeader';
import PesertaFilters from '../Controls/PesertaFilters';
import PesertaTable from '../PesertaTable';

interface Props {
  activityId: string;
  narasumber: any[];
  narasumberLoading: boolean;
  certificatesGenerated: boolean;
  narasumberSelectedIds: Array<string | number>;
  globalSelectedIds?: Array<string | number>;
  selectAllUsers?: boolean;
  totalAllRoles?: number;
  currentRole?: 'Peserta' | 'Panitia' | 'Narasumber';
  hasPesertaSelected?: boolean;
  openAddImportChooser: () => void;
  onBulkDeleteClick: () => void;
  onBulkEmailClick: () => void;
  onGenerateClick: () => void;
  isGenerating: boolean;
  statusFilter: any;
  onStatusChange: (v: any) => void;
  narasumberSearch: string;
  setNarasumberSearch: (v: string) => void;
  narasumberItemsPerPage: number;
  setNarasumberItemsPerPage: (v: number) => void;
  narasumberTotalPages: number;
  narasumberCurrentPage: number;
  setNarasumberCurrentPage: (v: number) => void;
  filteredNarasumber: any[];
  visibleNarasumber: any[];
  narasumberIsSelected: (id: string | number) => boolean;
  narasumberToggleSelect: (id: string | number) => void;
  narasumberToggleSelectAll: () => void;
  narasumberSendingIds: Array<string | number>;
  userId: number | null;
  onSelectAllEverything?: () => void;
  instruktur: string | null;
  sendEmailSingle: (p: any) => void;
  openEditModal: (p: any) => void;
  setDeleteConfirmation: (p: any) => void;
}

export default function NarasumberTab(props: Props) {
  return (
    <>
      <PesertaHeader
        totalPeserta={props.narasumber.length}
        totalAllRoles={props.totalAllRoles}
        currentRole={props.currentRole ?? 'Narasumber'}
        loading={props.narasumberLoading}
        certificatesGenerated={props.certificatesGenerated}
        selectedIds={props.selectAllUsers ? props.globalSelectedIds || [] : props.narasumberSelectedIds}
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
        pesertaSearch={props.narasumberSearch}
        onSearchChange={props.setNarasumberSearch}
        itemsPerPage={props.narasumberItemsPerPage}
        onItemsPerPageChange={(v) => { props.setNarasumberItemsPerPage(v); props.setNarasumberCurrentPage(1); }}
        totalPages={props.narasumberTotalPages}
        currentPage={props.narasumberCurrentPage}
        onPageChange={props.setNarasumberCurrentPage}
      />

      <PesertaTable
        loading={props.narasumberLoading}
        peserta={props.narasumber}
        filteredPeserta={props.filteredNarasumber}
        visiblePeserta={props.visibleNarasumber}
        currentPage={props.narasumberCurrentPage}
        itemsPerPage={props.narasumberItemsPerPage}
        isSelected={props.narasumberIsSelected}
        toggleSelect={props.narasumberToggleSelect}
        toggleSelectAll={props.narasumberToggleSelectAll}
        sendingIds={props.narasumberSendingIds}
        certificatesGenerated={props.certificatesGenerated}
        userId={props.userId}
        instruktur={props.instruktur}
        activityId={props.activityId}
        memberRole="narasumber"
        onSendEmail={(p: any) => props.sendEmailSingle(p)}
        onEdit={(p: any) => props.openEditModal(p)}
        onDelete={(p: any) => props.setDeleteConfirmation(p)}
      />
    </>
  );
}
