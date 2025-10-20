import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 12,
    offset: 0,
    total_pages: 0,
    current_page: 1
  });
  
  // Store selected row IDs across all pages
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRowsOnCurrentPage, setSelectedRowsOnCurrentPage] = useState<Artwork[]>([]);
  const [rowsToSelect, setRowsToSelect] = useState<string>('');
  const overlayRef = useRef<OverlayPanel>(null);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
      const data = await response.json();
      
      setArtworks(data.data);
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        total_pages: data.pagination.total_pages,
        current_page: data.pagination.current_page
      });
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(1);
  }, []);

  // Update selected rows on current page whenever artworks or selectedIds change
  useEffect(() => {
    const selectedOnPage = artworks.filter(artwork => selectedIds.has(artwork.id));
    setSelectedRowsOnCurrentPage(selectedOnPage);
  }, [artworks, selectedIds]);

  const onPageChange = (event: any) => {
    const newPage = event.page + 1;
    fetchArtworks(newPage);
  };

  const onSelectionChange = (e: any) => {
    const selectedRows: Artwork[] = e.value;
    const newSelectedIds = new Set(selectedIds);
    
    // Get all IDs from current page
    const currentPageIds = artworks.map(artwork => artwork.id);
    
    // Remove all current page IDs from selection
    currentPageIds.forEach(id => newSelectedIds.delete(id));
    
    // Add newly selected IDs
    selectedRows.forEach(row => newSelectedIds.add(row.id));
    
    setSelectedIds(newSelectedIds);
  };

  const handleSubmitRowSelection = () => {
    const count = parseInt(rowsToSelect);
    if (isNaN(count) || count < 1) {
      alert('Please enter a valid number');
      return;
    }

    const newSelectedIds = new Set(selectedIds);
    const rowsToAdd = Math.min(count, artworks.length);
    
    // Select the specified number of rows from current page
    for (let i = 0; i < rowsToAdd; i++) {
      newSelectedIds.add(artworks[i].id);
    }
    
    setSelectedIds(newSelectedIds);
    setRowsToSelect('');
    overlayRef.current?.hide();
  };

  const customHeader = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <i 
        className="pi pi-angle-down" 
        style={{ cursor: 'pointer', fontSize: '1.2rem' }}
        onClick={(e) => overlayRef.current?.toggle(e)}
      />
      <OverlayPanel ref={overlayRef}>
        <div style={{ padding: '1rem', minWidth: '250px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Select Rows
          </label>
          <InputText
            value={rowsToSelect}
            onChange={(e) => setRowsToSelect(e.target.value)}
            placeholder="Enter value"
            style={{ width: '100%', marginBottom: '0.75rem' }}
            type="number"
          />
          <Button
            label="Submit"
            onClick={handleSubmitRowSelection}
            style={{ width: '100%' }}
          />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: 'bold' }}>
        Artwork Collection
      </h1>
      
      {/* Custom Row Selection Panel */}
      <div style={{
        background: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
            Selected Rows: {selectedIds.size}
          </span>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      <DataTable
        value={artworks}
        loading={loading}
        paginator
        rows={pagination.limit}
        totalRecords={pagination.total}
        lazy
        first={(pagination.current_page - 1) * pagination.limit}
        onPage={onPageChange}
        selection={selectedRowsOnCurrentPage as any}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        selectionMode="checkbox"
        tableStyle={{ minWidth: '100%' }}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} artworks"
      >
        <Column
  selectionMode="multiple"
  headerStyle={{ width: '3rem' }}
/>
<Column
  headerStyle={{ width: '3rem' }}
  header={customHeader}
  body={() => null}
/>
        <Column 
          field="title" 
          header="Title" 
          style={{ minWidth: '200px' }}
          body={(rowData) => rowData.title || 'N/A'}
        />
        <Column 
          field="place_of_origin" 
          header="Place of Origin" 
          style={{ minWidth: '150px' }}
          body={(rowData) => rowData.place_of_origin || 'N/A'}
        />
        <Column 
          field="artist_display" 
          header="Artist" 
          style={{ minWidth: '200px' }}
          body={(rowData) => rowData.artist_display || 'N/A'}
        />
        <Column 
          field="inscriptions" 
          header="Inscriptions" 
          style={{ minWidth: '150px' }}
          body={(rowData) => rowData.inscriptions || 'N/A'}
        />
        <Column 
          field="date_start" 
          header="Date Start" 
          style={{ minWidth: '120px' }}
          body={(rowData) => rowData.date_start || 'N/A'}
        />
        <Column 
          field="date_end" 
          header="Date End" 
          style={{ minWidth: '120px' }}
          body={(rowData) => rowData.date_end || 'N/A'}
        />
      </DataTable>
    </div>
  );
};

export default App;