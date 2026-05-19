import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const empty = {
  firstName: '', lastName: '', maidenName: '', gender: 'UNKNOWN',
  birthDate: '', birthPlace: '', deathDate: '', deathPlace: '',
  bio: '', isArchival: false, familyLine: '', archivalNote: '',
};

export default function PersonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/persons/${id}`)
      .then(r => {
        const p = r.data;
        setForm({
          firstName: p.firstName || '', lastName: p.lastName || '',
          maidenName: p.maidenName || '', gender: p.gender || 'UNKNOWN',
          birthDate: p.birthDate || '', birthPlace: p.birthPlace || '',
          deathDate: p.deathDate || '', deathPlace: p.deathPlace || '',
          bio: p.bio || '', isArchival: p.isArchival || false,
          familyLine: p.familyLine || '', archivalNote: p.archivalNote || '',
        });
        const mainPhoto = p.media?.find(m => m.type === 'PHOTO');
        if (mainPhoto) setExistingPhoto(mainPhoto);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.maidenName) delete payload.maidenName;
      if (!payload.familyLine) delete payload.familyLine;
      if (!payload.archivalNote) delete payload.archivalNote;

      let personId = id;
      if (isEdit) {
        await api.put(`/persons/${id}`, payload);
      } else {
        const { data } = await api.post('/persons', payload);
        personId = data.id;
      }

      if (photo) {
        const fd = new FormData();
        fd.append('file', photo);
        await api.post(`/media/upload/${personId}`, fd);
      }

      navigate(`/people/${personId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-stone-500 py-20">Завантаження...</div>;

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const Input = ({ field, ...props }) => (
    <input
      value={form[field]}
      onChange={set(field)}
      className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      {...props}
    />
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-stone-500 hover:text-stone-800">← Назад</button>
        <h1 className="text-2xl font-bold text-stone-800">
          {isEdit ? 'Редагувати' : 'Додати людину'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-sm border border-stone-200">

        {/* Archival toggle */}
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <input
            type="checkbox"
            id="isArchival"
            checked={form.isArchival}
            onChange={set('isArchival')}
            className="w-4 h-4 accent-amber-500"
          />
          <label htmlFor="isArchival" className="text-sm text-amber-800 font-medium">
            Архівна особа (зв'язок із родом не підтверджено)
          </label>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Фото</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors overflow-hidden flex-shrink-0"
            >
              {photoPreview || existingPhoto ? (
                <img
                  src={photoPreview || existingPhoto?.url}
                  alt="фото"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-stone-300">📷</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="text-sm text-emerald-700 hover:text-emerald-900 font-medium"
              >
                {photoPreview || existingPhoto ? 'Змінити фото' : 'Завантажити фото'}
              </button>
              {photoPreview && (
                <p className="text-xs text-stone-500 mt-1">{photo?.name}</p>
              )}
              <p className="text-xs text-stone-400 mt-1">JPG, PNG до 20 МБ</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ім'я *">
            <Input field="firstName" placeholder="Іван" required />
          </Field>
          <Field label="Прізвище *">
            <Input field="lastName" placeholder="Коваленко" required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Дівоче прізвище">
            <Input field="maidenName" placeholder="Шевченко" />
          </Field>
          <Field label="Стать">
            <select
              value={form.gender}
              onChange={set('gender')}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="UNKNOWN">Не вказано</option>
              <option value="MALE">Чоловік</option>
              <option value="FEMALE">Жінка</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата народження">
            <Input field="birthDate" placeholder="1890 або 12.03.1890" />
          </Field>
          <Field label="Місце народження">
            <Input field="birthPlace" placeholder="м. Полтава" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата смерті">
            <Input field="deathDate" placeholder="1945 або 09.05.1945" />
          </Field>
          <Field label="Місце смерті">
            <Input field="deathPlace" placeholder="с. Мала Девиця" />
          </Field>
        </div>

        <Field label="Опис / Біографія">
          <textarea
            value={form.bio}
            onChange={set('bio')}
            rows={4}
            placeholder="Розкажіть про цю людину: де жила, чим займалась, що відомо..."
            className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </Field>

        {form.isArchival && (
          <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Field label="Родова лінія (прізвище роду)">
              <Input field="familyLine" placeholder="Наприклад: Коваленки, Шевченки..." />
            </Field>
            <Field label="Нотатки про можливий зв'язок">
              <textarea
                value={form.archivalNote}
                onChange={set('archivalNote')}
                rows={3}
                placeholder="Де знайдено, чому може бути пов'язана з родом..."
                className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </Field>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Додати'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-stone-300 text-stone-700 font-medium px-6 py-2 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}
