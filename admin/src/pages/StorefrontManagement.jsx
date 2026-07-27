// admin/src/pages/StorefrontManagement.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { convertToWebP } from '../utils/image';
import {
  Package, 
  Layers, 
  Sliders, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Check, 
  CheckCircle,
  X, 
  Search, 
  Loader2, 
  Eye, 
  Sparkles,
  Upload,
  Menu
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Modal } from '../components/Modal';
import './StorefrontManagement.css';

// Reusable Image Upload Input Component connected to Supabase Storage
const ImageUploadInput = ({ label, value, onChange, placeholder, required = false, local = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Auto convert to WebP client-side
      file = await convertToWebP(file);

      const formData = new FormData();
      formData.append('file', file);

      const uploadUrl = local ? '/admin-api/upload-local' : '/admin-api/upload';

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const resData = await res.json();
      onChange(resData.url);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="sf-form-group full-width">
      <label className="sf-label">{label}</label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        <input
          type="text"
          className="sf-input"
          style={{ flex: 1 }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
        <label 
          className="action-btn-green"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            padding: '10px 20px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
            height: '100%'
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={14} />
              <span>Upload File</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {value && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>Preview:</span>
          <a href={value} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>{value}</a>
        </div>
      )}
    </div>
  );
};

// Reusable Multiple Image Upload Input Component connected to Supabase Storage
const MultipleImageUploadInput = ({ label, value = [], onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // Auto convert to WebP client-side
        file = await convertToWebP(file);

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/admin-api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const resData = await res.json();
        uploadedUrls.push(resData.url);
      }

      onChange([...value, ...uploadedUrls]);
    } catch (err) {
      console.error('Multiple upload error:', err);
      alert('Failed to upload image(s): ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= value.length) return;
    const updated = [...value];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="sf-form-group full-width" style={{ gridColumn: '1 / -1' }}>
      <label className="sf-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{value.length} images uploaded</span>
      </label>
      
      {/* Upload area */}
      <div style={{ marginBottom: '16px' }}>
        <label 
          className="action-btn-green"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            padding: '10px 20px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Uploading Multiple...</span>
            </>
          ) : (
            <>
              <Upload size={14} />
              <span>Upload Images</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Preview Grid */}
      {value.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
          gap: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          {value.map((url, idx) => (
            <div 
              key={idx} 
              style={{ 
                position: 'relative', 
                aspectRatio: '1', 
                borderRadius: '6px', 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
              className="mult-img-thumb"
            >
              <img 
                src={url} 
                alt={`Product image ${idx + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {/* Overlays for delete and move */}
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(0,0,0,0.6)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  padding: '4px',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="mult-img-overlay"
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.9)', 
                      border: 'none', 
                      color: 'white', 
                      borderRadius: '4px', 
                      padding: '4px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <button 
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, -1)}
                    style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      border: 'none', 
                      color: 'white', 
                      borderRadius: '4px', 
                      padding: '2px 6px', 
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    ◀
                  </button>
                  <span style={{ fontSize: '10px', color: 'white', alignSelf: 'center', fontWeight: 'bold' }}>#{idx + 1}</span>
                  <button 
                    type="button"
                    disabled={idx === value.length - 1}
                    onClick={() => moveImage(idx, 1)}
                    style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      border: 'none', 
                      color: 'white', 
                      borderRadius: '4px', 
                      padding: '2px 6px', 
                      cursor: idx === value.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Interactive Size Guide (Size Chart) Editor Table Component
const SizeGuideTableEditor = ({ value, onChange }) => {
  const columns = value?.columns || ['Size', 'Waist', 'Hips', 'Length'];
  const rows = value?.rows || [];
  const material = value?.material || 'Cotton 100%';

  const [newColName, setNewColName] = useState('');

  const addColumn = () => {
    if (!newColName.trim()) return;
    const name = newColName.trim();
    if (columns.includes(name)) {
      alert('Column already exists!');
      return;
    }
    const updatedCols = [...columns, name];
    const updatedRows = rows.map(row => ({ ...row, [name]: '' }));
    onChange({ columns: updatedCols, rows: updatedRows, material });
    setNewColName('');
  };

  const removeColumn = (colName) => {
    if (colName === 'Size') {
      alert('The "Size" column cannot be removed as it is the primary identifier.');
      return;
    }
    if (!confirm(`Are you sure you want to remove the column "${colName}"?`)) return;
    const updatedCols = columns.filter(c => c !== colName);
    const updatedRows = rows.map(row => {
      const copy = { ...row };
      delete copy[colName];
      return copy;
    });
    onChange({ columns: updatedCols, rows: updatedRows, material });
  };

  const addRow = () => {
    const newRow = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    onChange({ columns, rows: [...rows, newRow], material });
  };

  const removeRow = (index) => {
    const updatedRows = rows.filter((_, idx) => idx !== index);
    onChange({ columns, rows: updatedRows, material });
  };

  const handleCellChange = (rowIndex, colName, val) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [colName]: val };
    onChange({ columns, rows: updatedRows, material });
  };

  const handleMaterialChange = (val) => {
    onChange({ columns, rows, material: val });
  };

  return (
    <div className="sf-form-group full-width" style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px', gridColumn: '1 / -1' }}>
      <label className="sf-label" style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '8px', display: 'block' }}>Size Chart Builder</label>
      
      {/* Material/Composition field */}
      <div className="sf-form-group" style={{ marginBottom: '16px', maxWidth: '300px' }}>
        <label className="sf-label" style={{ fontSize: '10px' }}>Material / Composition</label>
        <input 
          type="text" 
          className="sf-input" 
          value={material} 
          onChange={(e) => handleMaterialChange(e.target.value)}
          placeholder="e.g. Cotton 100%"
        />
      </div>

      {/* Add new Column form */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="sf-input" 
          style={{ width: '180px', padding: '6px 12px', fontSize: '12px' }}
          placeholder="New Column (e.g. Rise)"
          value={newColName}
          onChange={(e) => setNewColName(e.target.value)}
        />
        <button 
          type="button" 
          className="action-btn-green"
          onClick={addColumn}
          style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '4px', height: 'auto', boxShadow: 'none' }}
        >
          + Add Column
        </button>
      </div>

      {/* Size Chart Table Grid */}
      <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '4px', marginBottom: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
              {columns.map((col) => (
                <th key={col} style={{ padding: '10px 8px', fontWeight: 800, color: 'var(--text-secondary)', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>{col}</span>
                    {col !== 'Size' && (
                      <button 
                        type="button" 
                        onClick={() => removeColumn(col)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px', padding: '0 4px' }}
                        title="Remove Column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ width: '50px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {columns.map((col) => (
                  <td key={col} style={{ padding: '6px' }}>
                    <input 
                      type="text" 
                      className="sf-input" 
                      style={{ 
                        width: '100%', 
                        padding: '6px', 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        background: col === 'Size' ? 'rgba(13, 148, 136, 0.05)' : 'transparent',
                        borderColor: col === 'Size' ? 'rgba(13, 148, 136, 0.2)' : 'var(--glass-border)',
                        color: col === 'Size' ? 'var(--accent)' : 'inherit',
                        fontWeight: col === 'Size' ? 800 : 'normal'
                      }}
                      value={row[col] || ''} 
                      onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                      placeholder="—"
                    />
                  </td>
                ))}
                <td style={{ padding: '6px' }}>
                  <button 
                    type="button"
                    onClick={() => removeRow(rIdx)}
                    style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '20px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  No size guide rows added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button 
        type="button" 
        className="action-btn-green"
        onClick={addRow}
        style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '4px', height: 'auto', boxShadow: 'none' }}
      >
        + Add Size Row
      </button>
    </div>
  );
};

const defaultNavMenu = [
  { label: 'Home',         url: '/',                          type: 'link',     subs: [] },
  { label: 'Shop All',     url: '/shop',                      type: 'link',     subs: [] },
  { label: 'Men',          url: '/shop?category=men',         type: 'category', subs: [
    { label: 'Vintage Shirts',    url: '/shop?category=men&subcategory=Vintage+Shirts' },
    { label: 'Heritage Panjabis', url: '/shop?category=men&subcategory=Heritage+Panjabis' },
    { label: 'Kurtas',            url: '/shop?category=men&subcategory=Kurtas' },
    { label: 'Trousers',          url: '/shop?category=men&subcategory=Trousers' },
  ]},
  { label: 'Women',        url: '/shop?category=women',       type: 'category', subs: [
    { label: 'Vintage Sarees', url: '/shop?category=women&subcategory=Vintage+Sarees' },
    { label: 'Kurtis',         url: '/shop?category=women&subcategory=Kurtis' },
    { label: 'Salwar Kameez',  url: '/shop?category=women&subcategory=Salwar+Kameez' },
    { label: 'Retro Jackets',  url: '/shop?category=women&subcategory=Retro+Jackets' },
  ]},
  { label: 'Accessories',  url: '/shop?category=accessories', type: 'category', subs: [
    { label: 'Handcrafted Bags', url: '/shop?category=accessories&subcategory=Handcrafted+Bags' },
    { label: 'Antique Jewelry',  url: '/shop?category=accessories&subcategory=Antique+Jewelry' },
    { label: 'Heritage Shawls',  url: '/shop?category=accessories&subcategory=Heritage+Shawls' },
  ]},
  { label: 'Contact',      url: '/contact',                   type: 'link',     subs: [] },
];

const defaultHome = {
  heroBgImage: "/images/hero-banner.webp",
  heroBadge: "",
  heroSubBadge: "",
  heroHeading: "",
  heroSubtext: "",
  heroButtonText: "",

  collectionsLabel: "",
  collectionsTitle: "",

  latestLabel: "",
  latestTitle: "",

  catalogLabel: "",
  catalogTitle: "",
  catalogSubtext: "",

  brandStoryLabel: "",
  brandStoryImage: "",
  brandStoryImage2: "",
  brandStoryButtonText: "",
  brandStoryTitle: "",
  brandStoryText1: "",
  brandStoryText2: "",
  
  instagramLabel: "",
  instagramTitle: "",
  instagramSubtext: "",
  instagramUrl: "",
  instagramProfileImage: "",
  instagramImage1: "",
  instagramImage2: "",
  instagramImage3: "",
  instagramImage4: "",
  instagramImage5: "",

  shippingInsideDhaka: 80,
  shippingOutsideDhaka: 150,
  shippingSubDhaka: 100,
  freeDeliveryThreshold: 2500,
  discountEnabled: "true",
  discountThreshold: 3200,
  discountAmount: 250,
  welcome_popup_enabled: "true",
  welcome_image: "",
  welcome_title: "",
  welcome_text: "",
  welcome_button_text: "",
  welcome_link: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  trustBadge1: "",
  trustBadge2: "",
  trustBadge3: "",
  trustBadge4: "",
};

export const StorefrontManagement = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [homeSettings, setHomeSettings] = useState(defaultHome);
  const [navMenu, setNavMenu] = useState(defaultNavMenu);
  const [navSaving, setNavSaving] = useState(false);
  const [navSaved, setNavSaved] = useState(false);
  const [shopSlider, setShopSlider] = useState([]);
  const [sliderSaving, setSliderSaving] = useState(false);
  const [quickCreatingInventory, setQuickCreatingInventory] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null
  });

  const triggerConfirm = (title, description, onConfirm) => {
    setConfirmState({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  });

  const triggerAlert = (description, title = 'Alert', type = 'info') => {
    setAlertState({
      isOpen: true,
      title,
      description,
      type
    });
  };

  const showSuccess = (message, title = 'Success') => triggerAlert(message, title, 'success');
  const showError = (message, title = 'Error') => triggerAlert(message, title, 'error');
  const showInfo = (message, title = 'Info') => triggerAlert(message, title, 'info');

  // Contact Info
  const [contactInfo, setContactInfo] = useState({
    phone: '01827-406756', whatsapp: '01827406756',
    email: 'putimach324@gmail.com',
    address: 'House 42, Road 11, Banani, Dhaka, Bangladesh',
    facebook_url: 'https://www.facebook.com/share/1HitDwyphD',
    instagram_url: 'https://www.instagram.com/putimachhh?igsh=dnYxeXhhdHhodzdn',
    google_maps_url: 'https://maps.google.com/?q=House+42,+Road+11,+Banani,+Dhaka',
    flagship_name: 'PUTIMACH BANANI FLAGSHIP',
    flagship_address: 'House 42, Road 11, Banani, Dhaka',
  });
  const [contactSaving, setContactSaving] = useState(false);

  // FAQ
  const [faqItems, setFaqItems] = useState([]);
  const [faqSaving, setFaqSaving] = useState(false);

  // Return Policy
  const [returnPolicySections, setReturnPolicySections] = useState([]);
  const [returnSaving, setReturnSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Banners tab sections
  const [bannerSection, setBannerSection] = useState('hero');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states for Product
  const [prodForm, setProdForm] = useState({
    name: '', slug: '', category: '', price: '', original_price: '',
    badge: '', image: '', description: '', long_description: '',
    in_stock: true, sizes: '', colors: '', inventory_id: ''
  });

  // Form states for Category
  const [catForm, setCatForm] = useState({
    name: '', slug: '', description: '', image_url: ''
  });

  useEffect(() => {
    fetchStorefrontData();
  }, []);

  const fetchStorefrontData = async () => {
    setLoading(true);
    
    // 1. Fetch Products
    try {
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('id, data, created_at')
        .order('created_at', { ascending: false });
      if (prodErr) throw prodErr;
      const mappedProducts = (prodData || []).map(row => ({
        id: row.id,
        created_at: row.created_at,
        ...row.data
      }));
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
    }

    // 2. Fetch Categories
    try {
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('id, data, created_at')
        .order('created_at', { ascending: true });
      if (catErr) throw catErr;
      const mappedCategories = (catData || []).map(row => ({
        id: row.id,
        created_at: row.created_at,
        ...row.data
      }));
      setCategories(mappedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }

    // 3. Fetch Inventory
    try {
      const { data: invData, error: invErr } = await supabase
        .from('inventory')
        .select('id, name, sku, current_stock, variants')
        .order('name', { ascending: true });
      if (invErr) throw invErr;
      setInventoryItems(invData || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }

    // 4. Fetch Site Settings directly from Supabase DB
    try {
      const { data: allSettings } = await supabase
        .from('site_settings')
        .select('id, data');
      
      if (Array.isArray(allSettings)) {
        const homeObj = allSettings.find(s => s.id === 'home_page')?.data;
        const navObj = allSettings.find(s => s.id === 'nav_menu')?.data;
        const sliderObj = allSettings.find(s => s.id === 'shop_slider')?.data;
        const contactObj = allSettings.find(s => s.id === 'contact_info')?.data;
        const faqObj = allSettings.find(s => s.id === 'faq_page')?.data;
        const returnObj = allSettings.find(s => s.id === 'return_policy')?.data;

        if (homeObj) setHomeSettings({ ...defaultHome, ...homeObj });
        if (navObj && Array.isArray(navObj)) setNavMenu(navObj);
        if (sliderObj && Array.isArray(sliderObj)) setShopSlider(sliderObj);
        if (contactObj && typeof contactObj === 'object') setContactInfo(prev => ({ ...prev, ...contactObj }));
        if (faqObj && Array.isArray(faqObj)) setFaqItems(faqObj);
        if (returnObj && Array.isArray(returnObj)) setReturnPolicySections(returnObj);
      }
    } catch (err) {
      console.error('Error fetching site settings from Supabase:', err);
    }

    setLoading(false);
  };

  // Helper to generate slugs dynamically
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleProdNameChange = (e) => {
    const val = e.target.value;
    setProdForm(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === generateSlug(prev.name) || prev.slug === '' ? generateSlug(val) : prev.slug
    }));
  };

  const handleCatNameChange = (e) => {
    const val = e.target.value;
    setCatForm(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === generateSlug(prev.name) || prev.slug === '' ? generateSlug(val) : prev.slug
    }));
  };

  // Open Modal for Product Add/Edit
  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const defaultSizeGuide = {
        columns: ['Size', 'Waist', 'Hips', 'Length', 'Leg Opening', 'Rise'],
        rows: [],
        material: 'Cotton 100%'
      };
      setProdForm({
        name: product.name || '',
        slug: product.slug || '',
        category: product.category || '',
        price: product.price || '',
        original_price: product.original_price || '',
        badge: product.badge || '',
        image: product.image || '',
        images: Array.isArray(product.images) ? product.images : [],
        size_guide: product.size_guide && typeof product.size_guide === 'object' && Array.isArray(product.size_guide.columns) ? product.size_guide : defaultSizeGuide,
        features: Array.isArray(product.features) ? product.features.join(', ') : '',
        material: product.material || '',
        variants: Array.isArray(product.variants) ? product.variants : [],
        description: product.description || '',
        long_description: product.long_description || '',
        in_stock: product.in_stock !== false,
        sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
        colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
        inventory_id: product.inventory_id || ''
      });
    } else {
      const defaultSizeGuide = {
        columns: ['Size', 'Waist', 'Hips', 'Length', 'Leg Opening', 'Rise'],
        rows: [],
        material: 'Cotton 100%'
      };
      setEditingProduct(null);
      setProdForm({
        name: '', slug: '', category: categories[0]?.slug || '', price: '', original_price: '',
        badge: '', image: '', images: [], size_guide: defaultSizeGuide, 
        features: '100% Premium Material, Custom Oversized Fit, Garment Washed', material: 'Cotton 100%',
        variants: [],
        description: '', long_description: '',
        in_stock: true, sizes: 'S, M, L, XL', colors: 'Black, White', inventory_id: ''
      });
    }
    setIsProductModalOpen(true);
  };

  // Open Modal for Category Add/Edit
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCatForm({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        image_url: category.image_url || ''
      });
    } else {
      setEditingCategory(null);
      setCatForm({
        name: '', slug: '', description: '', image_url: ''
      });
    }
    setIsCategoryModalOpen(true);
  };

  // Variant Helper Functions
  const generateVariantCombinations = () => {
    const sizeList = prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const colorList = prodForm.colors.split(',').map(c => c.trim()).filter(Boolean);
    
    if (sizeList.length === 0 && colorList.length === 0) {
      showInfo('Please enter some Available Sizes or Colors first.', 'Input Needed');
      return;
    }

    const combinations = [];
    const baseSku = (prodForm.slug || prodForm.name.toLowerCase().replace(/\s+/g, '-')).toUpperCase();
    
    if (sizeList.length > 0 && colorList.length > 0) {
      sizeList.forEach(sz => {
        colorList.forEach(cl => {
          combinations.push({
            size: sz,
            color: cl,
            sku: `${baseSku}-${sz.toUpperCase()}-${cl.toUpperCase()}`,
            stock: 10
          });
        });
      });
    } else if (sizeList.length > 0) {
      sizeList.forEach(sz => {
        combinations.push({
          size: sz,
          color: '',
          sku: `${baseSku}-${sz.toUpperCase()}`,
          stock: 10
        });
      });
    } else {
      colorList.forEach(cl => {
        combinations.push({
          size: '',
          color: cl,
          sku: `${baseSku}-${cl.toUpperCase()}`,
          stock: 10
        });
      });
    }

    setProdForm({ ...prodForm, variants: combinations });
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...prodForm.variants];
    updated[index] = { ...updated[index], [field]: value };
    setProdForm({ ...prodForm, variants: updated });
  };

  const removeVariantRow = (index) => {
    const updated = prodForm.variants.filter((_, i) => i !== index);
    setProdForm({ ...prodForm, variants: updated });
  };

  const handleQuickCreateInventory = async () => {
    if (!prodForm.name) {
      alert('❌ Please enter the Product Name first to generate a matching inventory item.');
      return;
    }
    setQuickCreatingInventory(true);
    try {
      // Auto-generate SKU
      const sku = 'SKU-' + prodForm.name.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
      
      const payload = {
        name: prodForm.name,
        sku: sku,
        category: prodForm.category || 'general',
        current_stock: 50, // default placeholder stock
        min_stock_level: 5,
        selling_price: Number(prodForm.price) || 0,
        unit_price: Number(prodForm.price) || 0,
        making_cost: (Number(prodForm.price) || 0) * 0.4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      
      alert(`✅ Inventory Item Created & Connected!\nName: ${data.name}\nSKU: ${data.sku}\nInitial Stock: ${data.current_stock}`);
      
      // Update local state inventory items list
      setInventoryItems(prev => [...prev, data]);
      // Link the newly created item to the product form
      setProdForm(prev => ({ ...prev, inventory_id: data.id }));
    } catch (err) {
      console.error('Error quick creating inventory:', err);
      alert('❌ Failed to create inventory: ' + err.message);
    } finally {
      setQuickCreatingInventory(false);
    }
  };

  const syncVariantsFromInventory = (invId) => {
    if (!invId) return;
    const invItem = inventoryItems.find(i => i.id === invId);
    if (!invItem) return;
    
    const invVariants = Array.isArray(invItem.variants) ? invItem.variants : [];
    if (invVariants.length === 0) {
      showInfo('The selected inventory item does not have any variants defined.');
      return;
    }

    // Extract unique sizes and colors
    const uniqueSizes = [...new Set(invVariants.map(v => v.size).filter(Boolean))].join(', ');
    const uniqueColors = [...new Set(invVariants.map(v => v.color).filter(Boolean))].join(', ');

    setProdForm(prev => ({
      ...prev,
      inventory_id: invId,
      variants: invVariants.map(v => ({
        size: v.size || '',
        color: v.color || '',
        sku: v.sku || '',
        stock: Number(v.stock) || 0
      })),
      sizes: uniqueSizes,
      colors: uniqueColors
    }));
  };

  const addVariantRow = () => {
    const baseSku = (prodForm.slug || 'PROD').toUpperCase();
    const newVariant = {
      size: '',
      color: '',
      sku: `${baseSku}-VAR-${prodForm.variants.length + 1}`,
      stock: 10
    };
    setProdForm({ ...prodForm, variants: [...prodForm.variants, newVariant] });
  };

  // Save Product
  const saveProductSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    // Format tags arrays
    const formattedSizes = prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const formattedColors = prodForm.colors.split(',').map(c => c.trim()).filter(Boolean);
    const formattedFeatures = prodForm.features ? prodForm.features.split(',').map(f => f.trim()).filter(Boolean) : [];

    // Calculate total variants stock and override in_stock
    const hasVariants = Array.isArray(prodForm.variants) && prodForm.variants.length > 0;
    const totalVariantsStock = hasVariants 
      ? prodForm.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : 0;
    
    const isProductInStock = hasVariants ? (totalVariantsStock > 0) : prodForm.in_stock;

    const payload = {
      name: prodForm.name,
      slug: prodForm.slug,
      category: prodForm.category,
      price: Number(prodForm.price) || 0,
      original_price: prodForm.original_price ? Number(prodForm.original_price) : null,
      badge: prodForm.badge || null,
      image: prodForm.image,
      images: prodForm.images,
      size_guide: prodForm.size_guide,
      features: formattedFeatures,
      material: prodForm.material || null,
      variants: prodForm.variants || [],
      description: prodForm.description,
      long_description: prodForm.long_description,
      in_stock: isProductInStock,
      sizes: formattedSizes,
      colors: formattedColors,
      inventory_id: prodForm.inventory_id || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({ data: payload })
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            id: payload.slug || 'prod-' + Date.now(),
            data: payload,
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;
      }

      // Sync with inventory table if connected
      if (prodForm.inventory_id && hasVariants) {
        await supabase
          .from('inventory')
          .update({ current_stock: totalVariantsStock })
          .eq('id', prodForm.inventory_id);
      }

      setIsProductModalOpen(false);
      fetchStorefrontData();
    } catch (err) {
      console.error('Error saving product:', err);
      showError('Error saving product: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Save Category
  const saveCategorySubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    const payload = {
      name: catForm.name,
      slug: catForm.slug,
      description: catForm.description,
      image_url: catForm.image_url || null
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ data: payload })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            id: payload.slug || 'cat-' + Date.now(),
            data: payload,
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;
      }
      setIsCategoryModalOpen(false);
      fetchStorefrontData();
    } catch (err) {
      console.error('Error saving category:', err);
      showError('Error saving category: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    triggerConfirm(
      "Delete Product",
      "Are you absolutely sure you want to delete this product? This action cannot be undone.",
      async () => {
        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          fetchStorefrontData();
        } catch (err) {
          console.error('Error deleting product:', err);
        }
      }
    );
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    triggerConfirm(
      "Delete Category",
      "Are you sure you want to delete this category? This will not delete its products, but they will be uncategorized.",
      async () => {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;

          // Sync nav_menu in site_settings to remove deleted category entry
          const { data: catRows } = await supabase.from('categories').select('*');
          const remainingCatSlugs = new Set((catRows || []).map(c => c.slug || c.data?.slug || c.id));
          const { data: navData } = await supabase.from('site_settings').select('data').eq('id', 'nav_menu').maybeSingle();
          if (navData && Array.isArray(navData.data)) {
            const updatedNav = navData.data.filter(item => {
              if (item.type === 'category') {
                return remainingCatSlugs.has(item.slug);
              }
              return true;
            });
            await supabase.from('site_settings').update({ data: updatedNav }).eq('id', 'nav_menu');
          }

          fetchStorefrontData();
        } catch (err) {
          console.error('Error deleting category:', err);
        }
      }
    );
  };

  // Save Nav Menu
  const handleSaveNavMenu = async () => {
    setNavSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: 'nav_menu', data: navMenu, created_at: new Date().toISOString() });
      if (error) throw error;
      setNavSaved(true);
      setTimeout(() => setNavSaved(false), 3000);
    } catch (err) {
      showError('Failed to save nav menu: ' + err.message);
    } finally {
      setNavSaving(false);
    }
  };

  // Nav Menu helpers
  const addNavItem = () => {
    setNavMenu([...navMenu, { label: 'New Item', url: '/', type: 'link', subs: [] }]);
  };

  const updateNavItem = (idx, field, value) => {
    const updated = [...navMenu];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'type' && value === 'link') updated[idx].subs = [];
    setNavMenu(updated);
  };

  const removeNavItem = (idx) => {
    setNavMenu(navMenu.filter((_, i) => i !== idx));
  };

  const moveNavItem = (idx, dir) => {
    const updated = [...navMenu];
    const target = idx + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setNavMenu(updated);
  };

  const addSubItem = (parentIdx) => {
    const updated = [...navMenu];
    updated[parentIdx].subs = [...(updated[parentIdx].subs || []), { label: 'Sub Item', url: '/' }];
    setNavMenu(updated);
  };

  const updateSubItem = (parentIdx, subIdx, field, value) => {
    const updated = [...navMenu];
    updated[parentIdx].subs[subIdx] = { ...updated[parentIdx].subs[subIdx], [field]: value };
    setNavMenu(updated);
  };

  const removeSubItem = (parentIdx, subIdx) => {
    const updated = [...navMenu];
    updated[parentIdx].subs = updated[parentIdx].subs.filter((_, i) => i !== subIdx);
    setNavMenu(updated);
  };

  // Save Home Banner settings
  const handleSaveHomeSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (bannerSection === 'shop_slider') {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ id: 'shop_slider', data: shopSlider, created_at: new Date().toISOString() });
        if (error) throw error;
        fetch('/admin-api/site-settings/shop_slider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: shopSlider }),
        }).catch(() => null);
        alert('Shop page slider settings saved successfully! ✅');
      } else {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ id: 'home_page', data: homeSettings, created_at: new Date().toISOString() });
        if (error) throw error;
        fetch('/admin-api/site-settings/home_page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: homeSettings }),
        }).catch(() => null);
        alert('Homepage settings saved successfully! ✅');
      }
    } catch (err) {
      console.error('Error saving site settings:', err);
      showError('Failed to save: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="storefront-mgmt content-scrollable">
      
      {/* Elite Enterprise Header */}
      <div className="elite-enterprise-header">
        <div className="title-group-elite">
          <h1 className="premium-title-enterprise text-dark">
            Storefront <span className="text-accent-indigo">Management</span>
          </h1>
          <p className="premium-subtitle-enterprise">
            Control products, categories, collections, and custom banners in real time.
          </p>
        </div>

        <div className="header-actions-enterprise">
          {activeTab === 'products' && (
            <Button variant="primary" className="action-btn-green" onClick={() => openProductModal(null)}>
              <Plus size={16} /> Add Product
            </Button>
          )}
          {activeTab === 'categories' && (
            <Button variant="primary" className="action-btn-green" onClick={() => openCategoryModal(null)}>
              <Plus size={16} /> Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="sf-tabs-bar">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`sf-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        >
          <Package size={16} /> Products ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('categories')} 
          className={`sf-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
        >
          <Layers size={16} /> Categories ({categories.length})
        </button>
        <button 
          onClick={() => setActiveTab('banners')} 
          className={`sf-tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
        >
          <Sliders size={16} /> Banners & Sections
        </button>
        <button 
          onClick={() => setActiveTab('nav')} 
          className={`sf-tab-btn ${activeTab === 'nav' ? 'active' : ''}`}
        >
          <Menu size={16} /> Navigation Menu
        </button>
      </div>

      {loading ? (
        <div className="sf-loader-container">
          <Loader2 size={36} className="sf-loader" />
        </div>
      ) : (
        <div className="sf-tab-content">
          
          {/* 1. PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="sf-search-filters">
                <div className="search-input-wrapper flex-1">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search products by name or slug..." 
                    className="search-field"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="sf-select max-w-[200px]" 
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-surface-muted">
                  No products found matching filters.
                </div>
              ) : (
                <div className="sf-products-grid">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="sf-card">
                      <div className="sf-card-image-wrapper">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="sf-card-image" />
                        ) : (
                          <Package size={32} className="text-surface-muted" />
                        )}
                        {p.badge && <span className="sf-badge-pill">{p.badge}</span>}
                      </div>

                      <div className="sf-card-body">
                        <div className="sf-card-meta">
                          <span className="text-brand font-semibold">{p.category}</span>
                          {p.inventory_id ? (
                            <span className={p.inventory?.current_stock > 0 ? "text-green-500 font-bold animate-pulse" : "text-red-500 font-bold"}>
                              Stock: {p.inventory?.current_stock ?? 0}
                            </span>
                          ) : (
                            <span className={p.in_stock ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                              {p.in_stock ? "In Stock" : "Out of Stock"}
                            </span>
                          )}
                        </div>
                        <h3 className="sf-card-title">{p.name}</h3>
                        <p className="text-xs text-surface-muted truncate">/{p.slug}</p>
                        
                        <div className="sf-card-price-group">
                          <span className="sf-price-current">৳{p.price}</span>
                          {p.original_price && (
                            <span className="sf-price-original">৳{p.original_price}</span>
                          )}
                        </div>
                      </div>

                      <div className="sf-card-footer">
                        <Button variant="ghost" size="sm" onClick={() => openProductModal(p)}>
                          <Edit2 size={13} /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:bg-red-500/10">
                          <Trash2 size={13} /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="sf-categories-grid">
                {categories.map(c => (
                  <div key={c.id} className="sf-card">
                    <div className="sf-card-image-wrapper">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="sf-card-image" />
                      ) : (
                        <Layers size={32} className="text-surface-muted" />
                      )}
                    </div>
                    <div className="sf-card-body">
                      <h3 className="sf-card-title">{c.name}</h3>
                      <p className="text-xs text-surface-muted">slug: /{c.slug}</p>
                      <p className="text-sm text-surface-secondary mt-2 leading-relaxed line-clamp-2">{c.description || 'No description provided.'}</p>
                    </div>
                    <div className="sf-card-footer">
                      <Button variant="ghost" size="sm" onClick={() => openCategoryModal(c)}>
                        <Edit2 size={13} /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-500/10">
                        <Trash2 size={13} /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. BANNERS TAB (SITE CUSTOMIZER) */}
          {activeTab === 'banners' && (
            <div className="sf-banners-layout">
              {/* Sidebar */}
              <div className="sf-editor-sidebar">
                <button 
                  onClick={() => setBannerSection('hero')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'hero' ? 'active' : ''}`}
                >
                  Hero Banner
                </button>
                <button 
                  onClick={() => setBannerSection('shop_slider')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'shop_slider' ? 'active' : ''}`}
                >
                  Shop Page Slider
                </button>
                <button 
                  onClick={() => setBannerSection('drops')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'drops' ? 'active' : ''}`}
                >
                  Collections & Drops
                </button>
                <button 
                  onClick={() => setBannerSection('story')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'story' ? 'active' : ''}`}
                >
                  Brand Story
                </button>
                <button 
                  onClick={() => setBannerSection('instagram')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'instagram' ? 'active' : ''}`}
                >
                  Social / Instagram
                </button>
                <button 
                  onClick={() => setBannerSection('shipping')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'shipping' ? 'active' : ''}`}
                >
                  Shipping Charges
                </button>
                <button 
                  onClick={() => setBannerSection('contact')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'contact' ? 'active' : ''}`}
                >
                  Contact & Popups
                </button>
                <button 
                  onClick={() => setBannerSection('contact_info')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'contact_info' ? 'active' : ''}`}
                >
                  📞 Contact Info Page
                </button>
                <button 
                  onClick={() => setBannerSection('faq')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'faq' ? 'active' : ''}`}
                >
                  ❓ FAQ Page
                </button>
                <button 
                  onClick={() => setBannerSection('return_policy')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'return_policy' ? 'active' : ''}`}
                >
                  🔄 Returns & Exchanges
                </button>
                <button 
                  onClick={() => setBannerSection('trust')} 
                  className={`sf-sidebar-section-btn ${bannerSection === 'trust' ? 'active' : ''}`}
                >
                  Checkout Trust Badges
                </button>
              </div>

              {/* Editor Card */}
              <div className="sf-editor-content-card">
                <form onSubmit={handleSaveHomeSettings} className="space-y-6">
                  
                  {/* Hero banner section */}
                  {bannerSection === 'hero' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Hero Section Banner</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group">
                          <label className="sf-label">Hero Badge</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.heroBadge}
                            onChange={(e) => setHomeSettings({ ...homeSettings, heroBadge: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Hero Sub-Badge</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.heroSubBadge}
                            onChange={(e) => setHomeSettings({ ...homeSettings, heroSubBadge: e.target.value })}
                          />
                        </div>
                        <ImageUploadInput
                          label="Hero Background Image URL"
                          value={homeSettings.heroBgImage}
                          onChange={(val) => setHomeSettings({ ...homeSettings, heroBgImage: val })}
                          placeholder="e.g. /images/hero-banner.webp"
                        />
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Hero Main Heading</label>
                          <textarea 
                            className="sf-textarea" 
                            value={homeSettings.heroHeading}
                            onChange={(e) => setHomeSettings({ ...homeSettings, heroHeading: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Hero Subtext description</label>
                          <textarea 
                            className="sf-textarea" 
                            value={homeSettings.heroSubtext}
                            onChange={(e) => setHomeSettings({ ...homeSettings, heroSubtext: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Hero Button CTA text</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.heroButtonText}
                            onChange={(e) => setHomeSettings({ ...homeSettings, heroButtonText: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shop Page Slider section */}
                  {bannerSection === 'shop_slider' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Shop Page Slider</h2>
                      <p className="text-xs text-surface-muted">
                        These images will appear as an auto-sliding top product banner on the shop page, replacing the "THE SHOP ARCHIVE" heading text.
                      </p>
                      
                      <div className="space-y-4">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                          {shopSlider.map((imgUrl, idx) => (
                            <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '21/9', background: 'var(--surface-3)', border: '1px solid var(--glass-border)' }} className="group">
                              <img src={imgUrl} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="mult-img-overlay">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = shopSlider.filter((_, i) => i !== idx);
                                    setShopSlider(updated);
                                  }}
                                  style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: 'white', borderRadius: '50%', cursor: 'pointer' }}
                                  title="Delete Slide"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <span style={{ position: 'absolute', bottom: '8px', left: '8px', bg: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.6)', fontWeight: 'bold' }}>
                                Slide #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>

                        {shopSlider.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            No slider images uploaded. Upload some below.
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '16px' }}>
                          <ImageUploadInput
                            label="Upload New Slider Image (Saved directly to local cPanel files as WebP)"
                            value=""
                            onChange={(val) => {
                              if (val) {
                                setShopSlider([...shopSlider, val]);
                              }
                            }}
                            placeholder="Upload an image..."
                            local={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collections and Drops Section */}
                  {bannerSection === 'drops' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Collections & Catalog Sections</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group">
                          <label className="sf-label">Categories Section Sub-title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.collectionsLabel}
                            onChange={(e) => setHomeSettings({ ...homeSettings, collectionsLabel: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Categories Section Main Title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.collectionsTitle}
                            onChange={(e) => setHomeSettings({ ...homeSettings, collectionsTitle: e.target.value })}
                          />
                        </div>
                        
                        <div className="sf-form-group">
                          <label className="sf-label">New Arrivals Section Sub-title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.latestLabel}
                            onChange={(e) => setHomeSettings({ ...homeSettings, latestLabel: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">New Arrivals Section Title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.latestTitle}
                            onChange={(e) => setHomeSettings({ ...homeSettings, latestTitle: e.target.value })}
                          />
                        </div>

                        <div className="sf-form-group">
                          <label className="sf-label">Catalog Section Sub-title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.catalogLabel}
                            onChange={(e) => setHomeSettings({ ...homeSettings, catalogLabel: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Catalog Section Title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.catalogTitle}
                            onChange={(e) => setHomeSettings({ ...homeSettings, catalogTitle: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Catalog Subtext Description</label>
                          <textarea 
                            className="sf-textarea" 
                            value={homeSettings.catalogSubtext}
                            onChange={(e) => setHomeSettings({ ...homeSettings, catalogSubtext: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Brand Story Section */}
                  {bannerSection === 'story' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Brand Story</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group">
                          <label className="sf-label">Story Section Sub-title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.brandStoryLabel}
                            onChange={(e) => setHomeSettings({ ...homeSettings, brandStoryLabel: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Story Section Title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.brandStoryTitle}
                            onChange={(e) => setHomeSettings({ ...homeSettings, brandStoryTitle: e.target.value })}
                          />
                        </div>
                        <ImageUploadInput
                          label="Story Section First Image URL"
                          value={homeSettings.brandStoryImage}
                          onChange={(val) => setHomeSettings({ ...homeSettings, brandStoryImage: val })}
                          placeholder="e.g. /images/hoodie-rust.webp"
                        />
                        <ImageUploadInput
                          label="Story Section Second Image URL"
                          value={homeSettings.brandStoryImage2 || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, brandStoryImage2: val })}
                          placeholder="e.g. /images/story-image2.webp"
                        />
                        <div className="sf-form-group">
                          <label className="sf-label">Story Button Text</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.brandStoryButtonText || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, brandStoryButtonText: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Story Paragraph 1</label>
                          <textarea 
                            className="sf-textarea" 
                            value={homeSettings.brandStoryText1}
                            onChange={(e) => setHomeSettings({ ...homeSettings, brandStoryText1: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Story Paragraph 2</label>
                          <textarea 
                            className="sf-textarea" 
                            value={homeSettings.brandStoryText2}
                            onChange={(e) => setHomeSettings({ ...homeSettings, brandStoryText2: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instagram / Social section */}
                  {bannerSection === 'instagram' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Social Feed & Instagram Channel</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group">
                          <label className="sf-label">Instagram Section Sub-title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.instagramLabel}
                            onChange={(e) => setHomeSettings({ ...homeSettings, instagramLabel: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Instagram Section Title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.instagramTitle}
                            onChange={(e) => setHomeSettings({ ...homeSettings, instagramTitle: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Instagram URL / Profile link</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.instagramUrl}
                            onChange={(e) => setHomeSettings({ ...homeSettings, instagramUrl: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Instagram Subtext Description</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.instagramSubtext}
                            onChange={(e) => setHomeSettings({ ...homeSettings, instagramSubtext: e.target.value })}
                          />
                        </div>
                        <ImageUploadInput
                          label="Instagram Mini-profile Image URL"
                          value={homeSettings.instagramProfileImage}
                          onChange={(val) => setHomeSettings({ ...homeSettings, instagramProfileImage: val })}
                          placeholder="e.g. /images/hoodie-rust.webp"
                        />
                        <h3 className="text-sm font-bold full-width border-b border-base-800 pb-1 mt-4" style={{ gridColumn: '1 / -1' }}>Instagram Gallery Images</h3>
                        <ImageUploadInput
                          label="Instagram Gallery Image 1"
                          value={homeSettings.instagramImage1 || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, instagramImage1: val })}
                        />
                        <ImageUploadInput
                          label="Instagram Gallery Image 2"
                          value={homeSettings.instagramImage2 || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, instagramImage2: val })}
                        />
                        <ImageUploadInput
                          label="Instagram Gallery Image 3"
                          value={homeSettings.instagramImage3 || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, instagramImage3: val })}
                        />
                        <ImageUploadInput
                          label="Instagram Gallery Image 4"
                          value={homeSettings.instagramImage4 || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, instagramImage4: val })}
                        />
                        <ImageUploadInput
                          label="Instagram Gallery Image 5"
                          value={homeSettings.instagramImage5 || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, instagramImage5: val })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Shipping Charges section */}
                  {bannerSection === 'shipping' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Delivery & Shipping Fees</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group">
                          <label className="sf-label">Inside Dhaka Delivery Fee (৳)</label>
                          <input 
                            type="number" 
                            className="sf-input" 
                            value={homeSettings.shippingInsideDhaka || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, shippingInsideDhaka: Number(e.target.value) })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Sub Dhaka Delivery Fee (Savar, Gazipur, Narayanganj) (৳)</label>
                          <input 
                            type="number" 
                            className="sf-input" 
                            value={homeSettings.shippingSubDhaka || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, shippingSubDhaka: Number(e.target.value) })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Outside Dhaka Delivery Fee (৳)</label>
                          <input 
                            type="number" 
                            className="sf-input" 
                            value={homeSettings.shippingOutsideDhaka || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, shippingOutsideDhaka: Number(e.target.value) })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Free Delivery Threshold Min Order (৳)</label>
                          <input 
                            type="number" 
                            className="sf-input" 
                            value={homeSettings.freeDeliveryThreshold || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, freeDeliveryThreshold: Number(e.target.value) })}
                          />
                        </div>

                        <h3 className="text-sm font-bold full-width border-b border-base-800 pb-1 mt-4" style={{ gridColumn: '1 / -1' }}>Auto Discount Promotion</h3>

                        <div className="sf-form-group">
                          <label className="sf-label">Enable Promotion Discount?</label>
                          <select 
                            className="sf-select"
                            value={homeSettings.discountEnabled || 'true'}
                            onChange={(e) => setHomeSettings({ ...homeSettings, discountEnabled: e.target.value })}
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Discount Threshold Min Order (৳)</label>
                          <input 
                            type="number" 
                            className="sf-input" 
                            value={homeSettings.discountThreshold || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, discountThreshold: Number(e.target.value) })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Discount Amount (৳)</label>
                          <input 
                            type="number" 
                            className="sf-input" 
                            value={homeSettings.discountAmount || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, discountAmount: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact & Welcome Popup section */}
                  {bannerSection === 'contact' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Contact Details & Welcome Popup</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group">
                          <label className="sf-label">Contact Phone</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.contactPhone || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, contactPhone: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Contact Email</label>
                          <input 
                            type="email" 
                            className="sf-input" 
                            value={homeSettings.contactEmail || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, contactEmail: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Flagship Address</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.contactAddress || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, contactAddress: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Enable Welcome Popup?</label>
                          <select 
                            className="sf-select"
                            value={homeSettings.welcome_popup_enabled || 'true'}
                            onChange={(e) => setHomeSettings({ ...homeSettings, welcome_popup_enabled: e.target.value })}
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Welcome Popup Title</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.welcome_title || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, welcome_title: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Welcome Popup Description Text</label>
                          <textarea 
                            className="sf-textarea" 
                            value={homeSettings.welcome_text || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, welcome_text: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Welcome Popup Button Text</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.welcome_button_text || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, welcome_button_text: e.target.value })}
                          />
                        </div>
                        <div className="sf-form-group">
                          <label className="sf-label">Welcome Popup Link URL</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.welcome_link || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, welcome_link: e.target.value })}
                          />
                        </div>
                        <ImageUploadInput
                          label="Welcome Popup Image URL"
                          value={homeSettings.welcome_image || ''}
                          onChange={(val) => setHomeSettings({ ...homeSettings, welcome_image: val })}
                          placeholder="e.g. /images/welcome-banner.webp"
                        />
                      </div>
                    </div>
                  )}

                  {/* Contact Info Page Section */}
                  {bannerSection === 'contact_info' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-base-800 pb-2">
                        <h2 className="text-h3 font-black">📞 Contact Info Page</h2>
                        <button
                          type="button"
                          disabled={contactSaving}
                          onClick={async () => {
                            setContactSaving(true);
                            try {
                              const res = await fetch('/admin-api/site-settings/contact_info', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ data: contactInfo }),
                              });
                              const result = await res.json();
                              if (!result.success) throw new Error(result.error);
                              if (result.data) setContactInfo(prev => ({ ...prev, ...result.data }));
                              alert('✅ Contact info saved!');
                            } catch (err) { alert('❌ ' + err.message); }
                            finally { setContactSaving(false); }
                          }}
                          className="action-btn-primary"
                          style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '6px', height: 'auto', boxShadow: 'none' }}
                        >
                          {contactSaving ? 'Saving...' : '💾 Save Contact Info'}
                        </button>
                      </div>
                      <div className="sf-form-grid">
                        <div className="sf-form-group"><label className="sf-label">Phone Number</label><input type="text" className="sf-input" value={contactInfo.phone || ''} onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="01827-406756" /></div>
                        <div className="sf-form-group"><label className="sf-label">WhatsApp Number (digits only)</label><input type="text" className="sf-input" value={contactInfo.whatsapp || ''} onChange={e => setContactInfo({ ...contactInfo, whatsapp: e.target.value })} placeholder="01827406756" /></div>
                        <div className="sf-form-group full-width"><label className="sf-label">Email Address</label><input type="email" className="sf-input" value={contactInfo.email || ''} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} /></div>
                        <div className="sf-form-group full-width"><label className="sf-label">Full Address</label><input type="text" className="sf-input" value={contactInfo.address || ''} onChange={e => setContactInfo({ ...contactInfo, address: e.target.value })} /></div>
                        <div className="sf-form-group full-width"><label className="sf-label">Facebook URL</label><input type="url" className="sf-input" value={contactInfo.facebook_url || ''} onChange={e => setContactInfo({ ...contactInfo, facebook_url: e.target.value })} /></div>
                        <div className="sf-form-group full-width"><label className="sf-label">Instagram URL</label><input type="url" className="sf-input" value={contactInfo.instagram_url || ''} onChange={e => setContactInfo({ ...contactInfo, instagram_url: e.target.value })} /></div>
                        <div className="sf-form-group full-width"><label className="sf-label">Google Maps URL</label><input type="url" className="sf-input" value={contactInfo.google_maps_url || ''} onChange={e => setContactInfo({ ...contactInfo, google_maps_url: e.target.value })} /></div>
                        <div className="sf-form-group"><label className="sf-label">Flagship Store Name</label><input type="text" className="sf-input" value={contactInfo.flagship_name || ''} onChange={e => setContactInfo({ ...contactInfo, flagship_name: e.target.value })} /></div>
                        <div className="sf-form-group"><label className="sf-label">Flagship Store Address</label><input type="text" className="sf-input" value={contactInfo.flagship_address || ''} onChange={e => setContactInfo({ ...contactInfo, flagship_address: e.target.value })} /></div>
                      </div>
                    </div>
                  )}

                  {/* FAQ Page Section */}
                  {bannerSection === 'faq' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-base-800 pb-2">
                        <h2 className="text-h3 font-black">❓ FAQ Page</h2>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFaqItems([...faqItems, { id: Date.now(), q: 'New Question?', a: 'Answer here.' }])}
                            className="action-btn-green"
                            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '6px', height: 'auto', boxShadow: 'none' }}
                          >+ Add FAQ</button>
                          <button
                            type="button"
                            disabled={faqSaving}
                            onClick={async () => {
                              setFaqSaving(true);
                              try {
                                const res = await fetch('/admin-api/site-settings/faq_page', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ data: faqItems }),
                                });
                                const result = await res.json();
                                if (!result.success) throw new Error(result.error);
                                if (result.data && Array.isArray(result.data)) setFaqItems(result.data);
                                alert('✅ FAQ saved!');
                              } catch (err) { alert('❌ ' + err.message); }
                              finally { setFaqSaving(false); }
                            }}
                            className="action-btn-primary"
                            style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '6px', height: 'auto', boxShadow: 'none' }}
                          >{faqSaving ? 'Saving...' : '💾 Save FAQ'}</button>
                        </div>
                      </div>
                      {faqItems.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>No FAQ items yet. Click + Add FAQ to begin.</p>}
                      <div className="space-y-4">
                        {faqItems.map((item, idx) => (
                          <div key={item.id || idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                            <div className="flex justify-between items-center mb-3">
                              <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FAQ #{idx + 1}</span>
                              <button type="button" onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                            </div>
                            <div className="sf-form-group full-width" style={{ marginBottom: '10px' }}>
                              <label className="sf-label">Question</label>
                              <input type="text" className="sf-input" value={item.q} onChange={e => setFaqItems(faqItems.map((f, i) => i === idx ? { ...f, q: e.target.value } : f))} />
                            </div>
                            <div className="sf-form-group full-width">
                              <label className="sf-label">Answer</label>
                              <textarea className="sf-textarea" rows={3} value={item.a} onChange={e => setFaqItems(faqItems.map((f, i) => i === idx ? { ...f, a: e.target.value } : f))} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Return Policy Section */}
                  {bannerSection === 'return_policy' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-base-800 pb-2">
                        <h2 className="text-h3 font-black">🔄 Returns &amp; Exchanges Page</h2>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setReturnPolicySections([...returnPolicySections, { id: Date.now(), title: 'New Section', text: 'Section content here.' }])}
                            className="action-btn-green"
                            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '6px', height: 'auto', boxShadow: 'none' }}
                          >+ Add Section</button>
                          <button
                            type="button"
                            disabled={returnSaving}
                            onClick={async () => {
                              setReturnSaving(true);
                              try {
                                const res = await fetch('/admin-api/site-settings/return_policy', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ data: returnPolicySections }),
                                });
                                const result = await res.json();
                                if (!result.success) throw new Error(result.error);
                                if (result.data && Array.isArray(result.data)) setReturnPolicySections(result.data);
                                alert('✅ Return Policy saved!');
                              } catch (err) { alert('❌ ' + err.message); }
                              finally { setReturnSaving(false); }
                            }}
                            className="action-btn-primary"
                            style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '6px', height: 'auto', boxShadow: 'none' }}
                          >{returnSaving ? 'Saving...' : '💾 Save Policy'}</button>
                        </div>
                      </div>
                      {returnPolicySections.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>No sections yet. Click + Add Section to begin.</p>}
                      <div className="space-y-4">
                        {returnPolicySections.map((sec, idx) => (
                          <div key={sec.id || idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                            <div className="flex justify-between items-center mb-3">
                              <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section {idx + 1}</span>
                              <button type="button" onClick={() => setReturnPolicySections(returnPolicySections.filter((_, i) => i !== idx))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                            </div>
                            <div className="sf-form-group full-width" style={{ marginBottom: '10px' }}>
                              <label className="sf-label">Section Title</label>
                              <input type="text" className="sf-input" value={sec.title} onChange={e => setReturnPolicySections(returnPolicySections.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))} />
                            </div>
                            <div className="sf-form-group full-width">
                              <label className="sf-label">Section Content (use • for bullet points)</label>
                              <textarea className="sf-textarea" rows={5} value={sec.text} onChange={e => setReturnPolicySections(returnPolicySections.map((s, i) => i === idx ? { ...s, text: e.target.value } : s))} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trust Badges section */}
                  {bannerSection === 'trust' && (
                    <div className="space-y-4">
                      <h2 className="text-h3 font-black border-b border-base-800 pb-2">Checkout Trust Badges</h2>
                      <div className="sf-form-grid">
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Trust Badge 1</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.trustBadge1 || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, trustBadge1: e.target.value })}
                            placeholder="e.g. Cash on Delivery Available"
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Trust Badge 2</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.trustBadge2 || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, trustBadge2: e.target.value })}
                            placeholder="e.g. Check in front of Delivery Man"
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Trust Badge 3</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.trustBadge3 || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, trustBadge3: e.target.value })}
                            placeholder="e.g. No Return after Delivery Man Leaves"
                          />
                        </div>
                        <div className="sf-form-group full-width">
                          <label className="sf-label">Trust Badge 4</label>
                          <input 
                            type="text" 
                            className="sf-input" 
                            value={homeSettings.trustBadge4 || ''}
                            onChange={(e) => setHomeSettings({ ...homeSettings, trustBadge4: e.target.value })}
                            placeholder="e.g. Exchange Available (Conditions Apply)"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="sf-form-actions">
                    <Button variant="primary" type="submit" disabled={saveLoading} className="action-btn-green">
                      {saveLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. NAVIGATION MENU TAB */}
          {activeTab === 'nav' && (
            <div className="space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-h3 font-black">Navigation Menu</h2>
                  <p className="text-xs text-surface-muted mt-1">Drag to reorder · Edit labels & links · Toggle dropdown sub-items · Save when done.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={addNavItem}
                    className="action-btn-green"
                    style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '6px', height: 'auto', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={13} /> Add Item
                  </button>
                  <button
                    onClick={handleSaveNavMenu}
                    disabled={navSaving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 18px', fontSize: '12px', borderRadius: '6px',
                      cursor: navSaving ? 'not-allowed' : 'pointer',
                      background: navSaved ? 'rgba(34,197,94,0.15)' : 'var(--brand)',
                      color: navSaved ? 'rgb(34,197,94)' : '#fff',
                      border: navSaved ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--brand)',
                      fontWeight: 600, transition: 'all 0.2s',
                    }}
                  >
                    {navSaving ? <Loader2 size={13} className="spin" /> : navSaved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save to Website</>}
                  </button>
                </div>
              </div>

              {/* Menu Items List */}
              <div style={{ border: '1px solid var(--border-base)', borderRadius: '10px', overflow: 'hidden' }}>

                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 1.6fr 110px 80px 36px',
                  gap: '0',
                  padding: '10px 16px',
                  background: 'var(--surface-3)',
                  borderBottom: '1px solid var(--border-base)',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)', textTransform: 'uppercase',
                }}>
                  <span></span>
                  <span>Label</span>
                  <span>URL / Path</span>
                  <span>Type</span>
                  <span style={{ textAlign: 'center' }}>Sub-links</span>
                  <span></span>
                </div>

                {/* Rows */}
                {navMenu.map((item, idx) => (
                  <div key={idx}>
                    {/* Main Row */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr 1.6fr 110px 80px 36px',
                      gap: '0',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderBottom: item.type === 'category' && (item.subs||[]).length > 0 ? 'none' : '1px solid var(--border-base)',
                      background: idx % 2 === 0 ? 'var(--surface-1)' : 'var(--surface-2)',
                      transition: 'background 0.15s',
                    }}>
                      {/* Order controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <button
                          onClick={() => moveNavItem(idx, -1)}
                          disabled={idx === 0}
                          title="Move up"
                          style={{ background: 'none', border: 'none', padding: '1px 4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? 'var(--border-base)' : 'var(--text-tertiary)', lineHeight: 1, fontSize: '9px', borderRadius: '2px' }}
                        >▲</button>
                        <button
                          onClick={() => moveNavItem(idx, 1)}
                          disabled={idx === navMenu.length - 1}
                          title="Move down"
                          style={{ background: 'none', border: 'none', padding: '1px 4px', cursor: idx === navMenu.length - 1 ? 'not-allowed' : 'pointer', color: idx === navMenu.length - 1 ? 'var(--border-base)' : 'var(--text-tertiary)', lineHeight: 1, fontSize: '9px', borderRadius: '2px' }}
                        >▼</button>
                      </div>

                      {/* Label */}
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateNavItem(idx, 'label', e.target.value)}
                        style={{
                          background: 'transparent', border: 'none', outline: 'none',
                          fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                          width: '100%', padding: '4px 8px 4px 0',
                        }}
                        onFocus={e => e.target.style.background = 'var(--surface-3)'}
                        onBlur={e => e.target.style.background = 'transparent'}
                      />

                      {/* URL */}
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => updateNavItem(idx, 'url', e.target.value)}
                        style={{
                          background: 'transparent', border: 'none', outline: 'none',
                          fontSize: '12px', color: 'var(--text-secondary)',
                          fontFamily: 'monospace', width: '100%', padding: '4px 8px 4px 0',
                        }}
                        onFocus={e => e.target.style.background = 'var(--surface-3)'}
                        onBlur={e => e.target.style.background = 'transparent'}
                      />

                      {/* Type badge / toggle */}
                      <div>
                        <button
                          onClick={() => updateNavItem(idx, 'type', item.type === 'link' ? 'category' : 'link')}
                          style={{
                            fontSize: '10px', fontWeight: 700, padding: '3px 9px',
                            borderRadius: '20px', border: 'none', cursor: 'pointer',
                            background: item.type === 'category' ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.12)',
                            color: item.type === 'category' ? 'rgb(129,140,248)' : 'var(--text-tertiary)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {item.type === 'category' ? '⌄ Dropdown' : '→ Link'}
                        </button>
                      </div>

                      {/* Sub-link count */}
                      <div style={{ textAlign: 'center' }}>
                        {item.type === 'category' ? (
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: (item.subs||[]).length > 0 ? 'var(--brand)' : 'var(--text-tertiary)',
                          }}>
                            {(item.subs||[]).length} sub
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--border-base)' }}>—</span>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeNavItem(idx)}
                        title="Remove item"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-tertiary)', padding: '4px',
                          borderRadius: '4px', display: 'flex', alignItems: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Sub-items accordion */}
                    {item.type === 'category' && (
                      <div style={{
                        background: 'var(--surface-3)',
                        borderBottom: '1px solid var(--border-base)',
                        padding: '10px 16px 12px 48px',
                        borderLeft: '3px solid var(--brand)',
                      }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                          Dropdown Sub-links
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(item.subs || []).map((sub, si) => (
                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', minWidth: '16px' }}>↳</span>
                              <input
                                type="text"
                                className="sf-input"
                                placeholder="Sub-item label"
                                value={sub.label}
                                onChange={(e) => updateSubItem(idx, si, 'label', e.target.value)}
                                style={{ flex: '1', fontSize: '12px', padding: '6px 10px' }}
                              />
                              <input
                                type="text"
                                className="sf-input"
                                placeholder="/shop?category=men&subcategory=..."
                                value={sub.url}
                                onChange={(e) => updateSubItem(idx, si, 'url', e.target.value)}
                                style={{ flex: '2', fontSize: '12px', fontFamily: 'monospace', padding: '6px 10px' }}
                              />
                              <button
                                onClick={() => removeSubItem(idx, si)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: 'var(--text-tertiary)', padding: '4px 6px', borderRadius: '4px',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => addSubItem(idx)}
                          style={{
                            marginTop: '8px', fontSize: '11px', fontWeight: 600,
                            color: 'var(--brand)', background: 'transparent',
                            border: '1px dashed var(--brand)', borderRadius: '5px',
                            padding: '4px 14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Plus size={11} /> Add Sub-link
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {navMenu.length === 0 && (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                    No menu items yet. Click <strong>"+ Add Item"</strong> to get started.
                  </div>
                )}
              </div>

              {/* Live preview hint */}
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                💡 Click a <strong>→ Link</strong> or <strong>⌄ Dropdown</strong> badge to toggle the type.
              </p>
            </div>
          )}

        </div>
      )}

      {/* PRODUCT MODAL */}

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)}>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-base-800 pb-3">
            <h2 className="text-h3 font-black">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button className="btn-icon" onClick={() => setIsProductModalOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={saveProductSubmit} className="space-y-6">
            <div className="sf-form-grid">
              <div className="sf-form-group">
                <label className="sf-label">Product Name</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  value={prodForm.name}
                  onChange={handleProdNameChange}
                  required 
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label flex justify-between items-center">
                  <span>URL Slug</span>
                  <span className="text-[10px] text-brand flex items-center gap-1 cursor-pointer" onClick={() => setProdForm({ ...prodForm, slug: generateSlug(prodForm.name) })}>
                    <Sparkles size={10} /> Auto
                  </span>
                </label>
                <input 
                  type="text" 
                  className="sf-input" 
                  value={prodForm.slug}
                  onChange={(e) => setProdForm({ ...prodForm, slug: generateSlug(e.target.value) })}
                  required 
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Category</label>
                <select 
                  className="sf-select" 
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Link to Inventory Item (Stock Sync)</label>
                <select 
                  className="sf-select" 
                  value={prodForm.inventory_id || ''}
                  onChange={(e) => setProdForm({ ...prodForm, inventory_id: e.target.value || '' })}
                >
                  <option value="">-- No Link (Ignore Stock Control) --</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku || 'No SKU'}) - Stock: {item.current_stock}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {prodForm.inventory_id && (
                    <button
                      type="button"
                      onClick={() => syncVariantsFromInventory(prodForm.inventory_id)}
                      className="text-xs text-brand hover:text-brand-400 font-bold flex items-center gap-1.5 cursor-pointer bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-lg border border-brand/20 transition-all"
                    >
                      🔄 Import Variations from Linked Inventory
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={quickCreatingInventory}
                    onClick={handleQuickCreateInventory}
                    className="text-xs text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all"
                  >
                    {quickCreatingInventory ? 'Creating...' : '➕ Quick Create & Link Inventory'}
                  </button>
                </div>
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Badge Tag (e.g. Bestseller, New, Drop)</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  placeholder="Leave empty for none"
                  value={prodForm.badge}
                  onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Selling Price (BDT)</label>
                <input 
                  type="number" 
                  className="sf-input" 
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  required 
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Original/Strike Price (BDT)</label>
                <input 
                  type="number" 
                  className="sf-input" 
                  placeholder="Leave empty for no strike"
                  value={prodForm.original_price}
                  onChange={(e) => setProdForm({ ...prodForm, original_price: e.target.value })}
                />
              </div>

              <ImageUploadInput
                label="Product Main Image URL"
                value={prodForm.image}
                onChange={(val) => setProdForm({ ...prodForm, image: val })}
                placeholder="e.g. /images/hoodie-black.webp"
                required
              />

              <MultipleImageUploadInput
                label="Product Additional Images"
                value={prodForm.images || []}
                onChange={(urls) => setProdForm({ ...prodForm, images: urls })}
              />

              <SizeGuideTableEditor
                value={prodForm.size_guide}
                onChange={(guide) => setProdForm({ ...prodForm, size_guide: guide })}
              />

              <div className="sf-form-group">
                <label className="sf-label">Available Sizes (comma separated)</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  placeholder="e.g. S, M, L, XL"
                  value={prodForm.sizes}
                  onChange={(e) => setProdForm({ ...prodForm, sizes: e.target.value })}
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Available Colors (comma separated)</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  placeholder="e.g. black, rust, grey"
                  value={prodForm.colors}
                  onChange={(e) => setProdForm({ ...prodForm, colors: e.target.value })}
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Product Features (comma separated)</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  placeholder="e.g. 100% Premium Cotton, Oversized Fit"
                  value={prodForm.features || ''}
                  onChange={(e) => setProdForm({ ...prodForm, features: e.target.value })}
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Material / Fabric</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  placeholder="e.g. Cotton 100%, Heavyweight Fleece"
                  value={prodForm.material || ''}
                  onChange={(e) => setProdForm({ ...prodForm, material: e.target.value })}
                />
              </div>

              {/* Product Variations (Color, Size, SKU, Stock) */}
              <div className="sf-form-group full-width border border-base-300/30 rounded-xl p-4 bg-base-900/40 mt-2">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-surface-primary">Product Variations</h4>
                    <p className="text-xs text-surface-muted">Manage size & color combinations, SKUs, and individual stocks.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={generateVariantCombinations}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand/10 text-brand border border-brand/20 rounded-lg hover:bg-brand/20 transition-all cursor-pointer"
                    >
                      Auto-Generate Combinations
                    </button>
                    <button 
                      type="button" 
                      onClick={addVariantRow}
                      className="px-3 py-1.5 text-xs font-semibold bg-base-800 text-surface-primary border border-base-300/40 rounded-lg hover:bg-base-750 transition-all cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </div>
                </div>

                {(!prodForm.variants || prodForm.variants.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-base-300/20 rounded-lg">
                    <p className="text-xs text-surface-muted">No variations added yet. Click Auto-Generate or Add Row to start.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-base-300/20 text-surface-muted uppercase font-mono tracking-wider">
                          <th className="pb-2 pr-2 font-medium">Size</th>
                          <th className="pb-2 px-2 font-medium">Color</th>
                          <th className="pb-2 px-2 font-medium">SKU</th>
                          <th className="pb-2 px-2 font-medium">Stock</th>
                          <th className="pb-2 pl-2 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodForm.variants.map((v, idx) => (
                          <tr key={idx} className="border-b border-base-300/10 last:border-0">
                            <td className="py-2 pr-2">
                              <input 
                                type="text"
                                className="w-full bg-base-800 border border-base-300/30 rounded px-2 py-1 text-surface-primary"
                                placeholder="e.g. S"
                                value={v.size || ''}
                                onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input 
                                type="text"
                                className="w-full bg-base-800 border border-base-300/30 rounded px-2 py-1 text-surface-primary"
                                placeholder="e.g. Black"
                                value={v.color || ''}
                                onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input 
                                type="text"
                                className="w-full bg-base-800 border border-base-300/30 rounded px-2 py-1 text-surface-primary font-mono"
                                placeholder="SKU"
                                value={v.sku || ''}
                                onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-2 w-24">
                              <input 
                                type="number"
                                className="w-full bg-base-800 border border-base-300/30 rounded px-2 py-1 text-surface-primary"
                                placeholder="0"
                                value={v.stock}
                                onChange={(e) => handleVariantChange(idx, 'stock', Number(e.target.value) || 0)}
                              />
                            </td>
                            <td className="py-2 pl-2 text-right">
                              <button 
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                className="text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="sf-form-group full-width">
                <label className="sf-label">Short Description</label>
                <textarea 
                  className="sf-textarea" 
                  placeholder="Describe this product briefly..."
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="sf-form-group full-width">
                <label className="sf-label">Long Details Description</label>
                <textarea 
                  className="sf-textarea" 
                  placeholder="Provide detailed composition, sizing details etc..."
                  value={prodForm.long_description}
                  onChange={(e) => setProdForm({ ...prodForm, long_description: e.target.value })}
                  required
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label">Stock Status</label>
                <div className="sf-toggle-group">
                  <label className="sf-switch">
                    <input 
                      type="checkbox" 
                      checked={prodForm.in_stock}
                      onChange={(e) => setProdForm({ ...prodForm, in_stock: e.target.checked })}
                    />
                    <span className="sf-slider"></span>
                  </label>
                  <span className="text-sm font-semibold">{prodForm.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
              </div>
            </div>

            <div className="sf-form-actions">
              <Button variant="ghost" type="button" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saveLoading} className="action-btn-green">
                {saveLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save Product
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* CATEGORY MODAL */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-base-800 pb-3">
            <h2 className="text-h3 font-black">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <button className="btn-icon" onClick={() => setIsCategoryModalOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={saveCategorySubmit} className="space-y-6">
            <div className="sf-form-grid">
              <div className="sf-form-group">
                <label className="sf-label">Category Name</label>
                <input 
                  type="text" 
                  className="sf-input" 
                  value={catForm.name}
                  onChange={handleCatNameChange}
                  required 
                />
              </div>

              <div className="sf-form-group">
                <label className="sf-label flex justify-between items-center">
                  <span>URL Slug</span>
                  <span className="text-[10px] text-brand flex items-center gap-1 cursor-pointer" onClick={() => setCatForm({ ...catForm, slug: generateSlug(catForm.name) })}>
                    <Sparkles size={10} /> Auto
                  </span>
                </label>
                <input 
                  type="text" 
                  className="sf-input" 
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: generateSlug(e.target.value) })}
                  required 
                />
              </div>

              <ImageUploadInput
                label="Category Image URL"
                value={catForm.image_url}
                onChange={(val) => setCatForm({ ...catForm, image_url: val })}
                placeholder="e.g. /images/cat-hoodies.webp"
              />

              <div className="sf-form-group full-width">
                <label className="sf-label">Description</label>
                <textarea 
                  className="sf-textarea" 
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="sf-form-actions">
              <Button variant="ghost" type="button" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saveLoading} className="action-btn-green">
                {saveLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save Category
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Global Confirmation Dialog */}
      <AlertDialog open={confirmState.isOpen} onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setConfirmState(prev => ({ ...prev, isOpen: false }));
              if (confirmState.onConfirm) confirmState.onConfirm();
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Alert Dialog */}
      <AlertDialog open={alertState.isOpen} onOpenChange={(open) => setAlertState(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent style={{ maxWidth: 420 }}>
          <AlertDialogHeader>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
              {alertState.type === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', marginBottom: 4 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              )}
              {alertState.type === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', marginBottom: 4 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
              )}
              {alertState.type === 'info' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', marginBottom: 4 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
              )}
              <AlertDialogTitle style={{ marginTop: 4 }}>{alertState.title}</AlertDialogTitle>
              <AlertDialogDescription style={{ textAlign: 'center' }}>
                {alertState.description}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter style={{ justifyContent: 'center' }}>
            <AlertDialogAction onClick={() => setAlertState(prev => ({ ...prev, isOpen: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};
export default StorefrontManagement;
