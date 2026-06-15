import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const defaultForm = {
  model_name: '',
  shoot_date: '',
  start_time: '09:00',
  end_time: '',
  content: '',
  location: '',
  props: [],
  deposit_amount: 0,
  balance_amount: 0,
  deposit_received: false,
  balance_received: false,
};

export default function EventForm({ event, onSave, onClose }) {
  const [form, setForm] = useState(defaultForm);
  const [propInput, setPropInput] = useState('');
  const [errors, setErrors] = useState({});
  const propInputRef = useRef(null);

  const isEdit = !!event;

  useEffect(() => {
    if (event) {
      let props = [];
      try { props = JSON.parse(event.props || '[]'); } catch { /**/ }
      setForm({
        model_name: event.model_name || '',
        shoot_date: event.shoot_date || '',
        start_time: event.start_time || '09:00',
        end_time: event.end_time || '',
        content: event.content || '',
        location: event.location || '',
        props,
        deposit_amount: event.deposit_amount || 0,
        balance_amount: event.balance_amount || 0,
        deposit_received: !!event.deposit_received,
        balance_received: !!event.balance_received,
      });
    }
  }, [event]);

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const addProp = () => {
    const val = propInput.trim();
    if (!val) return;
    if (form.props.includes(val)) {
      setPropInput('');
      return;
    }
    update('props', [...form.props, val]);
    setPropInput('');
    propInputRef.current?.focus();
  };

  const removeProp = (idx) => {
    update('props', form.props.filter((_, i) => i !== idx));
  };

  const handlePropKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProp();
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.model_name.trim()) errs.model_name = '请输入模特姓名';
    if (!form.shoot_date) errs.shoot_date = '请选择拍摄日期';
    if (!form.content.trim()) errs.content = '请输入拍摄内容';
    if (!form.location.trim()) errs.location = '请输入拍摄地点';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const today = new Date().toISOString().split('T')[0];
    onSave({
      ...form,
      // 确保零值正确传递
      deposit_amount: Number(form.deposit_amount) || 0,
      balance_amount: Number(form.balance_amount) || 0,
    });
  };

  const labelClass = "label";
  const inputClass = "input";

  return (
    <>
      {/* 遮罩 */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* 抽屉 */}
      <div className="drawer">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-lg font-bold">{isEdit ? '编辑拍摄' : '新增拍摄'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
          {/* 模特姓名 */}
          <div>
            <label className={labelClass}>模特姓名 *</label>
            <input
              className={inputClass}
              value={form.model_name}
              onChange={e => update('model_name', e.target.value)}
              placeholder="输入模特姓名"
            />
            {errors.model_name && <p className="text-red-500 text-xs mt-1">{errors.model_name}</p>}
          </div>

          {/* 拍摄日期 */}
          <div>
            <label className={labelClass}>拍摄日期 *</label>
            <input
              type="date"
              className={inputClass}
              value={form.shoot_date}
              onChange={e => update('shoot_date', e.target.value)}
            />
            {errors.shoot_date && <p className="text-red-500 text-xs mt-1">{errors.shoot_date}</p>}
          </div>

          {/* 时间 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>开始时间</label>
              <input
                type="time"
                className={inputClass}
                value={form.start_time}
                onChange={e => update('start_time', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>结束时间 <span className="text-gray-400 font-normal">(可选)</span></label>
              <input
                type="time"
                className={inputClass}
                value={form.end_time}
                onChange={e => update('end_time', e.target.value)}
              />
            </div>
          </div>

          {/* 拍摄内容 */}
          <div>
            <label className={labelClass}>拍摄内容 *</label>
            <input
              className={inputClass}
              value={form.content}
              onChange={e => update('content', e.target.value)}
              placeholder="如：古风人像、私房写真"
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
          </div>

          {/* 拍摄地点 */}
          <div>
            <label className={labelClass}>拍摄地点 *</label>
            <input
              className={inputClass}
              value={form.location}
              onChange={e => update('location', e.target.value)}
              placeholder="输入拍摄地点（支持中文）"
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>

          {/* 道具列表 */}
          <div>
            <label className={labelClass}>需要准备的道具</label>
            <div className="flex gap-2">
              <input
                ref={propInputRef}
                className={`${inputClass} flex-1`}
                value={propInput}
                onChange={e => setPropInput(e.target.value)}
                onKeyDown={handlePropKeyDown}
                placeholder="输入道具名称，按回车添加"
              />
              <button
                type="button"
                onClick={addProp}
                className="btn-secondary shrink-0 !px-3"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.props.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.props.map((p, i) => (
                  <span key={i} className="tag gap-1.5">
                    {p}
                    <button
                      type="button"
                      onClick={() => removeProp(i)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 金额 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>定金（元）</label>
              <input
                type="number"
                className={inputClass}
                value={form.deposit_amount || ''}
                onChange={e => update('deposit_amount', e.target.value ? Number(e.target.value) : 0)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>尾款（元）</label>
              <input
                type="number"
                className={inputClass}
                value={form.balance_amount || ''}
                onChange={e => update('balance_amount', e.target.value ? Number(e.target.value) : 0)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* 收款状态 */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.deposit_received}
                onChange={e => update('deposit_received', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-400"
              />
              <span className="text-sm font-medium">已收定金</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.balance_received}
                onChange={e => update('balance_received', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-400"
              />
              <span className="text-sm font-medium">已收尾款</span>
            </label>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? '保存修改' : '添加事件'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
