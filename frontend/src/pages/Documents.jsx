import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    const { data } = await api.get('/documents');
    setDocuments(data);
    setLoadingList(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Choose a PDF file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process document');
    } finally {
      setUploading(false);
    }
  };

  const startChat = async (documentId) => {
    const { data } = await api.post('/chat', { documentId });
    navigate(`/chat/${data._id}`);
  };

  const catalogNo = (index) => `No. ${String(documents.length - index).padStart(3, '0')}`;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 pb-16">
      <p className="catalog-number mb-2">Collection</p>
      <h1 className="font-display text-3xl text-text mb-1">The Stacks</h1>
      <p className="text-sm text-text-muted mb-8">
        Accession a document, then open a reading room to question it.
      </p>

      <form onSubmit={handleUpload} className="border border-dashed border-border rounded-sm p-6 mb-10 bg-surface/40">
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-surface-2 file:text-text file:text-xs file:cursor-pointer"
          />
          <button
            disabled={uploading}
            className="bg-brass text-ink font-medium text-sm rounded-sm px-4 py-2 hover:bg-brass-light transition-colors disabled:opacity-50"
          >
            {uploading ? 'Accessioning…' : 'Add to the stacks'}
          </button>
        </div>
        {uploading && (
          <p className="text-xs text-text-muted mt-3 font-mono">
            Chunking text and generating embeddings — this can take a moment for longer documents.
          </p>
        )}
      </form>

      {loadingList ? (
        <p className="text-text-muted text-sm font-mono">Loading catalog…</p>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-sm">
          <p className="font-display text-lg text-text-muted mb-1">The stacks are empty</p>
          <p className="text-sm text-text-muted">Add a PDF above to begin your first reading room.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((d, i) => (
            <div key={d._id} className="stack-card">
              <p className="catalog-number mb-2">{catalogNo(i)}</p>
              <h3 className="font-display text-lg text-text mb-1 leading-snug break-words">
                {d.filename}
              </h3>
              <p className="text-xs text-text-muted font-mono mb-4">
                {d.chunkCount} excerpts indexed · {new Date(d.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => startChat(d._id)}
                className="text-sm text-brass hover:text-brass-light font-medium"
              >
                Open reading room →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
