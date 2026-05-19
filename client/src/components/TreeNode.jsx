import { useNavigate } from 'react-router-dom';

const NODE_W = 150;
const NODE_H = 180;

export { NODE_W, NODE_H };

export default function TreeNode({ node, person, isRoot, style }) {
  const navigate = useNavigate();

  if (!person) {
    // placeholder node (missing parent/spouse)
    return (
      <div
        style={{ ...style, width: NODE_W, height: NODE_H }}
        className="absolute flex items-center justify-center"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-300 text-2xl">
          ?
        </div>
      </div>
    );
  }

  const photo = person.mainPhoto;
  const isMale = person.gender === 'MALE';
  const isFemale = person.gender === 'FEMALE';

  const borderColor = isMale
    ? 'border-blue-400'
    : isFemale
    ? 'border-pink-400'
    : 'border-stone-300';

  const bgColor = isMale
    ? 'bg-blue-50'
    : isFemale
    ? 'bg-pink-50'
    : 'bg-white';

  const ringColor = isRoot ? 'ring-4 ring-emerald-500 ring-offset-2' : '';

  const years = [person.birthDate, person.deathDate].filter(Boolean).join(' – ');

  return (
    <div
      style={{ ...style, width: NODE_W, height: NODE_H }}
      className="absolute flex items-center justify-center cursor-pointer select-none"
      onClick={() => navigate(`/people/${person.id}`)}
    >
      <div
        className={`
          w-[138px] h-[168px] rounded-2xl border-2 ${borderColor} ${bgColor} ${ringColor}
          flex flex-col items-center justify-center gap-1.5 p-2
          shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150
        `}
      >
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center border-2 border-white shadow">
          {photo
            ? <img src={photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-3xl">{isMale ? '👨' : isFemale ? '👩' : '👤'}</span>
          }
        </div>

        {/* Name */}
        <div className="text-center leading-tight w-full px-1">
          <div className="text-xs font-semibold text-stone-800 truncate">{person.firstName}</div>
          <div className="text-xs text-stone-600 truncate">{person.lastName}</div>
        </div>

        {/* Years */}
        {years && (
          <div className="text-[10px] text-stone-400 leading-none">{years}</div>
        )}

        {/* Root badge */}
        {isRoot && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            корінь
          </div>
        )}
      </div>
    </div>
  );
}
