import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../src/bot/stateManager.js', () => ({
  __esModule: true,
  default: {
    clearStateData: jest.fn(),
    setState: jest.fn(),
  },
}));

import stateManager from '../src/bot/stateManager.js';
import { finalizarLeadTransmision } from '../src/utils/finalizarLeadTransmision.js';
import { clearCachedBotToken } from '../src/services/backend-auth.js';

const { clearStateData, setState } = stateManager;

describe('finalizarLeadTransmision', () => {
  let client;
  let fetchMock;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.ADMIN_PHONE = '573001112233';
    process.env.BACKEND_URL = 'http://localhost:3000';
    process.env.BOT_API_KEY = 'bot-key-test';
    process.env.BOT_LOGIN_EMAIL = 'bot@billar.com';
    process.env.BOT_LOGIN_PASSWORD = 'bot-secret';

    client = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    clearCachedBotToken();
    fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify({ ok: true, token: 'token-test' })),
      })
      .mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    clearStateData.mockResolvedValue(undefined);
    setState.mockResolvedValue(undefined);
  });

  it('envia el payload al endpoint y notifica al admin con los datos correctos', async () => {
    const stateData = {
      contactName: 'Juan',
      contactPhone: 3001234567,
      billiardName: 'Billar XYZ',
      city: 'Bogota',
      tournamentType: 'RELAMPAGO',
      eventDate: '2026-03-12',
      serviceType: 'TRANSMISION',
      comments: '',
    };

    await finalizarLeadTransmision(client, '12345', stateData, {});

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Bot-Token': 'bot-key-test',
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/api/transmissions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: expect.stringMatching(/^Bearer\s.+/),
          'X-Bot-Token': 'bot-key-test',
        }),
      }),
    );

    const body = JSON.parse(fetchMock.mock.calls[1][1].body);

    expect(body).toEqual({
      contactName: 'Juan',
      contactPhone: 3001234567,
      billiardName: 'Billar XYZ',
      city: 'Bogota',
      tournamentType: 'RELAMPAGO',
      eventDate: '2026-03-12',
      serviceType: 'TRANSMISION',
      whatsappId: '12345',
      comments: '',
    });

    expect(client.sendMessage).toHaveBeenNthCalledWith(
      1,
      '12345',
      '✅ Gracias Juan.\nNuestro equipo revisará la información y te enviará la propuesta en breve.',
    );

    expect(client.sendMessage).toHaveBeenNthCalledWith(
      2,
      '573001112233',
      '📢 NUEVO LEAD TRANSMISIÓN\n\n👤 Contacto: Juan\n🏢 Billar: Billar XYZ\n📍 Ciudad: Bogota\n🎯 Tipo: RELAMPAGO\n📅 Fecha: 2026-03-12\n🎥 Servicio: TRANSMISION\n📱 Tel: 3001234567',
    );

    expect(clearStateData).toHaveBeenCalledWith('12345');
    expect(setState).toHaveBeenCalledWith('12345', 'HUMAN_TAKEOVER');
  });
});
