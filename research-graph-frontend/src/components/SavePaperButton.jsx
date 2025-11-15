import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react';
import { getCollections, savePaper, createCollection } from '../services/library';

const SavePaperButton = ({ paper }) => {
  const [collections, setCollections] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await getCollections();
      setCollections(data.collections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const handleSaveToPaper = async (collectionId) => {
    try {
      await savePaper(paper.id, collectionId);
      setShowMenu(false);
      alert('Paper saved successfully');
    } catch (error) {
      console.error('Failed to save paper:', error);
      alert('Failed to save paper');
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const data = await createCollection(newCollectionName);
      await savePaper(paper.id, data.collection.id);
      setNewCollectionName('');
      setShowNewCollection(false);
      setShowMenu(false);
      loadCollections();
      alert('Collection created and paper saved!');
    } catch (error) {
      console.error('Failed to create collection:', error)
      alert('Failed to create collection');
    }
  };

  return (
    <div className="save-paper-container">
      <button
        className="save-paper-button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        <Bookmark size={16} />
        Save
      </button>

      {showMenu && (
        <div className="save-paper-menu" onClick={(e) => e.stopPropagation()}>
          <div className="save-menu-header">Save to Collection</div>
          
          {(collections && collections.length === 0) ? (
            <div className="save-menu-empty">No collections yet</div>
          ) : (
            <div className="save-menu-list">
              {collections.map(collection => (
                <button
                  key={collection.id}
                  className="save-menu-item"
                  onClick={() => handleSaveToPaper(collection.id)}
                >
                  <BookmarkCheck size={14} />
                  <span>{collection.name}</span>
                  <span className="collection-count">({collection.paper_count})</span>
                </button>
              ))}
            </div>
          )}

          {!showNewCollection ? (
            <button
              className="save-menu-create"
              onClick={() => setShowNewCollection(true)}
            >
              <Plus size={16} />
              New Collection
            </button>
          ) : (
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
        </div>
      )}
    </div>
  );
};

export default SavePaperButton;
