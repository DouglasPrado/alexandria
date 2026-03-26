import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import type { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar membro', description: 'Login com email e senha. Retorna JWT e seta cookie httpOnly.' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido — JWT retornado no body e cookie' })
  @ApiResponse({ status: 401, description: 'Credenciais invalidas' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    // Set JWT as httpOnly cookie (24h)
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Renovar JWT', description: 'Renova o token JWT usando o cookie access_token.' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token ausente ou invalido' })
  async refresh(@Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }
    return this.authService.refresh(token);
  }
}
