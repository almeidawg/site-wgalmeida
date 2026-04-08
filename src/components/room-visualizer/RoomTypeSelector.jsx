import React from 'react';
import { motion } from '@/lib/motion-lite';
import {
  Sofa,
  Bed,
  UtensilsCrossed,
  Bath,
  Briefcase,
  Baby,
  Dumbbell,
  Trees,
  MoreHorizontal,
} from 'lucide-react';

const ROOM_TYPES = [
  {
    id: 'sala',
    name: 'Sala de Estar',
    icon: Sofa,
    description: 'Living room, sala de TV',
    prompt: 'living room, lounge area',
  },
  {
    id: 'quarto',
    name: 'Quarto',
    icon: Bed,
    description: 'Suíte, quarto de casal',
    prompt: 'bedroom, master bedroom',
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    icon: UtensilsCrossed,
    description: 'Cozinha, copa',
    prompt: 'kitchen, modern kitchen',
  },
  {
    id: 'banheiro',
    name: 'Banheiro',
    icon: Bath,
    description: 'Banheiro, lavabo',
    prompt: 'bathroom, modern bathroom',
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    icon: Briefcase,
    description: 'Home office, sala de trabalho',
    prompt: 'home office, study room',
  },
  {
    id: 'infantil',
    name: 'Quarto Infantil',
    icon: Baby,
    description: 'Quarto de criança, brinquedoteca',
    prompt: 'kids bedroom, playroom',
  },
  {
    id: 'academia',
    name: 'Academia',
    icon: Dumbbell,
    description: 'Espaço fitness, sala de yoga',
    prompt: 'home gym, fitness room',
  },
  {
    id: 'varanda',
    name: 'Varanda/Terraço',
    icon: Trees,
    description: 'Área externa, jardim',
    prompt: 'balcony, terrace, outdoor space',
  },
  {
    id: 'outro',
    name: 'Outro',
    icon: MoreHorizontal,
    description: 'Especificar tipo de ambiente',
    prompt: 'interior space',
  },
];

const RoomTypeSelector = ({ selectedRoom, onSelectRoom, customRoomName, onCustomRoomChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Selecione o Tipo de Ambiente
      </h3>
      <p className="text-sm text-gray-500">
        Isso ajuda a IA a entender melhor o espaço e aplicar as referências corretamente
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ROOM_TYPES.map((room) => {
          const Icon = room.icon;
          const isSelected = selectedRoom?.id === room.id;

          return (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRoom(room)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-wg-orange bg-wg-orange/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-wg-orange text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-medium ${isSelected ? 'text-wg-orange' : 'text-gray-800'}`}>
                    {room.name}
                  </p>
                  <p className="text-xs text-gray-500">{room.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom room name input when "Outro" is selected */}
      {selectedRoom?.id === 'outro' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descreva o tipo de ambiente:
          </label>
          <input
            type="text"
            value={customRoomName || ''}
            onChange={(e) => onCustomRoomChange?.(e.target.value)}
            placeholder="Ex: Sala de jogos, Adega, Closet..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-wg-orange focus:border-transparent"
          />
        </motion.div>
      )}

      {selectedRoom && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl">
          <p className="text-sm text-green-800">
            <span className="font-medium">Ambiente selecionado:</span> {selectedRoom.name}
            {selectedRoom.id === 'outro' && customRoomName && ` - ${customRoomName}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomTypeSelector;
