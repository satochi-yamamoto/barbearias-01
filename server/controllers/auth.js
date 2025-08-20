const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const supabase = require('../config/supabase');
const User = require('../models/User');

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone
      }
    }
  });

  if (error) {
    return next(new ErrorResponse(error.message, 400));
  }

  res.status(201).json({ success: true, data });
});

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Por favor, informe email e senha', 400));
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return next(new ErrorResponse(error.message, 401));
  }

  res.status(200).json({ success: true, data });
});

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const { data: { user } } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1])

  if (!user) {
    return next(new ErrorResponse('Usuário não encontrado', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Esqueci a senha
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL}/reset-password`
  });

  if (error) {
    return next(new ErrorResponse(error.message, 500));
  }

  res.status(200).json({ success: true, data: 'Email enviado' });
});

// @desc    Reset de senha
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  const { data, error } = await supabase.auth.updateUser({
    password
  }, { accessToken: resettoken });

  if (error) {
    return next(new ErrorResponse(error.message, 400));
  }

  res.status(200).json({ success: true, data });
});

// @desc    Atualizar detalhes do usuário
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;
  const { data: { user } } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1])

  const { data, error } = await supabase.auth.updateUser({
    data: { name, phone }
  });

  if (error) {
    return next(new ErrorResponse(error.message, 400));
  }

  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  const { data, error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    return next(new ErrorResponse(error.message, 400));
  }

  res.status(200).json({ success: true, data });
});