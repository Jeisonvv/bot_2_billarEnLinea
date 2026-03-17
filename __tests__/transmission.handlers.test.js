import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../src/bot/stateManager.js', () => ({
  __esModule: true,
  default: {
    setState: jest.fn(),
    getStateData: jest.fn(),
    setStateData: jest.fn(),
    clearStateData: jest.fn(),
  },
}));

jest.mock('../src/services/user.service.js', () => ({
  __esModule: true,
  upDateName: jest.fn(),
  findOrCreateUser: jest.fn(),
  updateUserPhoneAndName: jest.fn(),
  registerUserInteraction: jest.fn(),
}));

jest.mock('../src/utils/finalizarLeadTransmision.js', () => ({
  __esModule: true,
  finalizarLeadTransmision: jest.fn(),
}));

jest.mock('../src/utils/messages.js', () => ({
  __esModule: true,
  messageWelcome: jest.fn(),
}));

jest.mock('../src/utils/stateTipingDelay.js', () => ({
  __esModule: true,
  stateTypingDelay: jest.fn(),
}));

import stateManager from '../src/bot/stateManager.js';
import {
  upDateName,
  findOrCreateUser,
  updateUserPhoneAndName,
  registerUserInteraction,
} from '../src/services/user.service.js';
import { finalizarLeadTransmision } from '../src/utils/finalizarLeadTransmision.js';
import { messageWelcome } from '../src/utils/messages.js';
import { stateTypingDelay } from '../src/utils/stateTipingDelay.js';
import { handleTransmissionSteps } from '../src/bot/flows/transmissions/transmission.handlers.js';

const { setState, getStateData, setStateData, clearStateData } = stateManager;

describe('handleTransmissionSteps', () => {
  let client;
  let msg;
  let userData;

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    msg = {
      from: '12345',
      body: 'Juan',
      getChat: jest.fn().mockResolvedValue({
        sendSeen: jest.fn().mockResolvedValue(undefined),
        sendStateTyping: jest.fn().mockResolvedValue(undefined),
      }),
    };

    userData = { name: '', phone: undefined };

    getStateData.mockResolvedValue({});
    setState.mockResolvedValue(undefined);
    setStateData.mockResolvedValue(undefined);
    clearStateData.mockResolvedValue(undefined);
    findOrCreateUser.mockResolvedValue({ _id: 'abc123' });
    upDateName.mockResolvedValue({ name: 'Juan' });
    updateUserPhoneAndName.mockResolvedValue(undefined);
    registerUserInteraction.mockResolvedValue(undefined);
    finalizarLeadTransmision.mockResolvedValue(undefined);
    messageWelcome.mockReturnValue('Bienvenido');
    stateTypingDelay.mockResolvedValue(undefined);
  });

  it('guarda el nombre en TRANSMISSION_INITIAL', async () => {
    await handleTransmissionSteps(client, msg, 'TRANSMISSION_INITIAL', userData);

    expect(setStateData).toHaveBeenCalledWith(
      '12345',
      expect.objectContaining({ contactName: 'Juan' }),
    );
    expect(setState).toHaveBeenCalledWith('12345', 'TRANSMISSION_CITY');
  });

  it('guarda el nombre del billar en TRANSMISSION_CITY', async () => {
    msg.body = 'Billar XYZ';

    await handleTransmissionSteps(client, msg, 'TRANSMISSION_CITY', userData);

    expect(setStateData).toHaveBeenCalledWith(
      '12345',
      expect.objectContaining({ billiardName: 'Billar XYZ' }),
    );
    expect(setState).toHaveBeenCalledWith('12345', 'TRANSMISSION_TOURNAMENT_TYPE');
  });

  it('guarda la ciudad en TRANSMISSION_TOURNAMENT_TYPE', async () => {
    msg.body = 'Bogota';

    await handleTransmissionSteps(client, msg, 'TRANSMISSION_TOURNAMENT_TYPE', userData);

    expect(setStateData).toHaveBeenCalledWith(
      '12345',
      expect.objectContaining({ city: 'Bogota' }),
    );
    expect(setState).toHaveBeenCalledWith('12345', 'TRANSMISSION_TOURNAMENT_SELECT');
  });

  it('guarda el tipo de torneo en TRANSMISSION_TOURNAMENT_SELECT', async () => {
    msg.body = '1';

    await handleTransmissionSteps(client, msg, 'TRANSMISSION_TOURNAMENT_SELECT', userData);

    expect(setStateData).toHaveBeenCalledWith(
      '12345',
      expect.objectContaining({ tournamentType: 'RELAMPAGO' }),
    );
    expect(setState).toHaveBeenCalledWith('12345', 'TRANSMISSION_DATE');
  });

  it('guarda la fecha en TRANSMISSION_DATE', async () => {
    msg.body = '2026-03-12';

    await handleTransmissionSteps(client, msg, 'TRANSMISSION_DATE', userData);

    expect(setStateData).toHaveBeenCalledWith(
      '12345',
      expect.objectContaining({ eventDate: '2026-03-12' }),
    );
    expect(setState).toHaveBeenCalledWith('12345', 'TRANSMISSION_SERVICE_TYPE');
  });

  it('guarda el telefono en TRANSMISSION_CONTACT_PHONE', async () => {
    msg.body = '3001234567';

    await handleTransmissionSteps(client, msg, 'TRANSMISSION_CONTACT_PHONE', userData);

    expect(setStateData).toHaveBeenCalledWith(
      '12345',
      expect.objectContaining({ contactPhone: 3001234567 }),
    );
    expect(updateUserPhoneAndName).toHaveBeenCalledWith('abc123', 3001234567, undefined);
    expect(registerUserInteraction).toHaveBeenCalledWith({
      userId: 'abc123',
      interestType: 'TRANSMISSION',
      channel: 'WHATSAPP',
    });
  });

  it('muestra en consola el payload final', async () => {
    getStateData.mockResolvedValue({
      contactName: 'Juan',
      billiardName: 'Billar XYZ',
      city: 'Bogota',
      tournamentType: 'RELAMPAGO',
      eventDate: '2026-03-12',
      serviceType: 'TRANSMISION',
    });

    msg.body = '3001234567';

    await handleTransmissionSteps(client, msg, 'TRANSMISSION_CONTACT_PHONE', userData);

    const [, user, stateData] = finalizarLeadTransmision.mock.calls[0];

    const payload = {
      contactName: stateData.contactName,
      contactPhone: stateData.contactPhone,
      billiardName: stateData.billiardName,
      city: stateData.city,
      tournamentType: stateData.tournamentType,
      eventDate: stateData.eventDate,
      serviceType: stateData.serviceType,
      whatsappId: user,
      comments: stateData.comments || '',
    };

    console.log(JSON.stringify(payload, null, 2));
  });
});
