import React, { useState, useEffect } from 'react';
import { Library, Plus, Trash2, Download, X } from 'lucide-react';
import { getCollections, createCollection, deleteCollection, getCollectionPapers, exportCollection } from '../services/library';

const LibrarySidebar = ({ isOpen, onClose, onPaperClick }) => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionPapers, seCollectionPapers] = useState([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    try {
      const data = await getCollections();
      setCollections(data.collections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      await createCollection(newCollectionName);
      setNewCollectionName('');
      setShowNewCollection(false);
      loadCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Delete this collection?')) return;

    try {
      await deleteCollection(collectionId);
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null);
        setCollectionPapers([]);
      }
      loadCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
    
  };

  const handleSelectCollection = async (collection) => {
    setSelectedCollection(collection);
    try {
      const data = await getCollectionPapers(collection.id);
      setCollectionPapers(data.papers);
    } catch (error) {
      console.error('Failed to load collection papers:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedCollection) return;

    try {
      const bibtex = await exportCollection(selectedCollection.id);
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCollection.name}.bib`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export collection:', error);
    }

  };

  if (!isOpen) return null;

  return (
    <div className="library-sidebar-overlay" onClick={onClose}>
      <div className="library-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="library-header">
          <div className="library-title">
            <Library size={24} />
            <h2>My Library</h2>
          </div>
          <button className="library-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="library-content">
          <div className="collections-panel">
            <div className="collections-header">
              <h3>Collections</h3>
              <button className="btn-new-collection" onClick={() => setShowNewCollection(true)}>
                <Plus size={16} />
              </button>
            </div>

            {showNewCollection && (
              <form onSubmit={handleCreateCollection} className="new-collection-form">
                <input
                  type="text"
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="new-collection-input"
                  autoFocus
                />
                <div className="new-collection-actions">
                  <button type="submit" className="btn-create">Create</button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowNewCollection(false);
                      setNewCollectionName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="collections-list">
              {collections.map(collection => (
                <div
                  key={collection.id}
                  className={`collection-item ${selectedCollection?.id === collection.id ? 'active' : ''}`}
                  onClick={() => handleSelectCollection(collection)}
                >
                  <div className="collection-info">
                    <span className="collection-name">{collection.name}</span>
                    <span className="collection-count">{collection.paper_count} papers</span>
                  </div>
                  <button
                    className="btn-delete-collection"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(collection.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedCollection && (
            <div className="collection-papers-panel">
              <div className="collection-papers-header">
                <h3>{selectedCollection.name}</h3>
                <button className="btn-export" onClick={handleExport}>
                  <Download size={16} />
                  Export BibTeX
                </button>
              </div>

              <div className="collection-papers-list">
                {collectionPapers.length === 0 ? (
                  <div className="empty-collection">No papers saved yet</div>
                ) : (
                  collectionPapers.map(savedPaper => (
                    <div
                      key={savedPaper.id}
                      className="saved-paper-item"
                      onClick={() => {
                        onPaperClick(savedPaper.paper);
                        onClose();
                      }}
                    >
                      <h4>{savedPaper.paper.title}</h4>
                      <div className="saved-paper-meta">
                        <span>{savedPaper.paper.publication_year}</span>
                        <span>{savedPaper.paper.citation_count} citations</span>
                      </div>
                      {savedPaper.notes && (
                        <p className="saved-paper-notes">{savedPaper.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarySidebar;
