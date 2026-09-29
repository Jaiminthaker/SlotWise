import * as resources from '../services/resourceService.js';

export async function list(req, res) { res.json({ services: await resources.listServices() }); }
export async function create(req, res) { res.status(201).json({ service: await resources.createService(req.validated.body) }); }
export async function update(req, res) { res.json({ service: await resources.updateService(req.validated.params.id, req.validated.body) }); }
export async function remove(req, res) { res.json({ service: await resources.deleteService(req.validated.params.id) }); }
export async function listProviders(req, res) { res.json({ providers: await resources.listProviders(req.validated.query.serviceId) }); }
export async function createProvider(req, res) { res.status(201).json({ provider: await resources.createProvider(req.validated.body) }); }