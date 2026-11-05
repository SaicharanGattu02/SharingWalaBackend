import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as supportService from './support.service.js';

export const getSupportInfo = asyncHandler(async (req, res) => {
  const info = await supportService.getSupportInfo();
  res.status(200).json(new ApiResponse(200, info, 'Support channels and FAQs retrieved successfully'));
});

export const submitContactTicket = asyncHandler(async (req, res) => {
  const result = await supportService.createSupportTicket(req.body, req.user || null);
  res.status(201).json(new ApiResponse(201, result, 'Support ticket created successfully'));
});

export const listTickets = asyncHandler(async (req, res) => {
  const tickets = await supportService.listSupportTickets();
  res.status(200).json(new ApiResponse(200, tickets, 'Support tickets retrieved'));
});

