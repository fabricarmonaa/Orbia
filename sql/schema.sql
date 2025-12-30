-- =====================================================
-- TENANTS (EMPRESAS CLIENTES)
-- =====================================================
CREATE TABLE tenants (
  id CHAR(26) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Historial de cambios de estado del tenant (sin NULLs)
CREATE TABLE tenant_status_history (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  status ENUM('ACTIVE','SUSPENDED') NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- Config de IA por tenant
CREATE TABLE tenant_ai_configs (
  tenant_id CHAR(26) PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,
  model VARCHAR(80) NOT NULL,
  vector_store_ref VARCHAR(255) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- =====================================================
-- USERS (CUENTAS DE SISTEMA)
-- =====================================================
CREATE TABLE users (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  dni VARCHAR(16) NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','USER') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uniq_tenant_dni (tenant_id, dni),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
  user_id CHAR(26) PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Campos extra configurables por tenant
CREATE TABLE extra_fields (
  field_id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(80) NOT NULL,
  type ENUM('TEXT','NUMBER','DATE') NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_extra_field_name (tenant_id, name)
) ENGINE=InnoDB;

CREATE TABLE user_extra_values (
  user_id CHAR(26) NOT NULL,
  field_id CHAR(26) NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, field_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (field_id) REFERENCES extra_fields(field_id)
) ENGINE=InnoDB;

-- =====================================================
-- PEDIDOS
-- =====================================================
CREATE TABLE order_statuses (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(60) NOT NULL,
  code VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_order_status_code (tenant_id, code),
  UNIQUE KEY uniq_order_status_name (tenant_id, name)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  status_id CHAR(26) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  internal_notes TEXT NOT NULL,
  user_notes TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (status_id) REFERENCES order_statuses(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id CHAR(26) PRIMARY KEY,
  order_id CHAR(26) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- =====================================================
-- PAGOS
-- =====================================================
CREATE TABLE payment_methods (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(60) NOT NULL,
  code VARCHAR(30) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_payment_method_code (tenant_id, code),
  UNIQUE KEY uniq_payment_method_name (tenant_id, name)
) ENGINE=InnoDB;

-- Pagos SIEMPRE existen, y la relación con pedidos es aparte (sin NULL)
CREATE TABLE payments (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  method_id CHAR(26) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- Vínculo N:N entre pagos y pedidos (pago puede cubrir varios pedidos)
CREATE TABLE payment_orders (
  payment_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  PRIMARY KEY (payment_id, order_id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- =====================================================
-- FACTURAS
-- =====================================================
CREATE TABLE invoice_templates (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(80) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_invoice_template_name (tenant_id, name)
) ENGINE=InnoDB;

CREATE TABLE invoice_template_fields (
  id CHAR(26) PRIMARY KEY,
  template_id CHAR(26) NOT NULL,
  label VARCHAR(80) NOT NULL,
  type ENUM('TEXT','NUMBER','DATE') NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  position INT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES invoice_templates(id),
  UNIQUE KEY uniq_template_field_position (template_id, position)
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  template_id CHAR(26) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES invoice_templates(id)
) ENGINE=InnoDB;

-- Relación factura ↔ pedido(s) sin NULLs
CREATE TABLE invoice_orders (
  invoice_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  PRIMARY KEY (invoice_id, order_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_field_values (
  id CHAR(26) PRIMARY KEY,
  invoice_id CHAR(26) NOT NULL,
  field_id CHAR(26) NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (field_id) REFERENCES invoice_template_fields(id)
) ENGINE=InnoDB;

-- =====================================================
-- CAJA
-- =====================================================
CREATE TABLE cash_categories (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(80) NOT NULL,
  type ENUM('INCOME','EXPENSE') NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_cash_category (tenant_id, name, type)
) ENGINE=InnoDB;

CREATE TABLE cash_movements (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  category_id CHAR(26) NOT NULL,
  method_id CHAR(26) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES cash_categories(id),
  FOREIGN KEY (method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- =====================================================
-- AUDITORÍA / EVENTOS DE DOMINIO (CQRS)
-- =====================================================
CREATE TABLE audit_events (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  aggregate_id CHAR(26) NOT NULL,
  type VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- (Opcional pero muy útil para IA y depuración)
CREATE TABLE ai_command_logs (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  command_text TEXT NOT NULL,
  parsed_payload JSON NOT NULL,
  status ENUM('PENDING','APPLIED','REJECTED') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =====================================================
-- READ MODELS (MATERIALIZADAS)
-- =====================================================
CREATE TABLE users_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  dni VARCHAR(16) NOT NULL,
  name VARCHAR(160) NOT NULL,
  last_payment TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:00',
  balance DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE orders_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  status VARCHAR(60) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  last_update TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payments_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(60) NOT NULL,
  paid_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE cashbox_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  category VARCHAR(80) NOT NULL,
  method VARCHAR(60) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- =====================================================
-- STEP 2: TRACKING LINKS AND STATUS HISTORY
-- =====================================================
CREATE TABLE public_tracking_links (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  UNIQUE KEY uniq_token_hash (token_hash)
) ENGINE=InnoDB;

CREATE TABLE order_status_history (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  status_id CHAR(26) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note_visible TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (status_id) REFERENCES order_statuses(id)
) ENGINE=InnoDB;i m p o r t   ' d o t e n v / c o n f i g ' ;  
 i m p o r t   m y s q l   f r o m   ' m y s q l 2 / p r o m i s e ' ;  
  
 c o n s t   d b C o n f i g   =   {  
         h o s t :   p r o c e s s . e n v . D B _ H O S T ,  
         p o r t :   p r o c e s s . e n v . D B _ P O R T ,  
         u s e r :   p r o c e s s . e n v . D B _ U S E R ,  
         p a s s w o r d :   p r o c e s s . e n v . D B _ P A S S W O R D ,  
         d a t a b a s e :   p r o c e s s . e n v . D B _ N A M E ,  
 } ;  
  
 c o n s t   s q l   =   `  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   o r d e r _ s t a t u s _ t r a n s i t i o n s   (  
     i d   C H A R ( 2 6 )   P R I M A R Y   K E Y ,  
     t e n a n t _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     f r o m _ s t a t u s _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     t o _ s t a t u s _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     F O R E I G N   K E Y   ( t e n a n t _ i d )   R E F E R E N C E S   t e n a n t s ( i d ) ,  
     F O R E I G N   K E Y   ( f r o m _ s t a t u s _ i d )   R E F E R E N C E S   o r d e r _ s t a t u s e s ( i d ) ,  
     F O R E I G N   K E Y   ( t o _ s t a t u s _ i d )   R E F E R E N C E S   o r d e r _ s t a t u s e s ( i d ) ,  
     U N I Q U E   K E Y   u n i q _ t r a n s i t i o n   ( t e n a n t _ i d ,   f r o m _ s t a t u s _ i d ,   t o _ s t a t u s _ i d )  
 )   E N G I N E = I n n o D B ;  
 ` ;  
  
 a s y n c   f u n c t i o n   m i g r a t e ( )   {  
         c o n s t   c o n n e c t i o n   =   a w a i t   m y s q l . c r e a t e C o n n e c t i o n ( d b C o n f i g ) ;  
         c o n s o l e . l o g ( ' R u n n i n g   m i g r a t i o n   S t e p   3 . . . ' ) ;  
         a w a i t   c o n n e c t i o n . q u e r y ( s q l ) ;  
         c o n s o l e . l o g ( ' M i g r a t i o n   S t e p   3   c o m p l e t e . ' ) ;  
         a w a i t   c o n n e c t i o n . e n d ( ) ;  
 }  
  
 m i g r a t e ( ) . c a t c h ( c o n s o l e . e r r o r ) ;  
 i m p o r t   ' d o t e n v / c o n f i g ' ;  
 i m p o r t   m y s q l   f r o m   ' m y s q l 2 / p r o m i s e ' ;  
  
 c o n s t   d b C o n f i g   =   {  
         h o s t :   p r o c e s s . e n v . D B _ H O S T ,  
         p o r t :   p r o c e s s . e n v . D B _ P O R T ,  
         u s e r :   p r o c e s s . e n v . D B _ U S E R ,  
         p a s s w o r d :   p r o c e s s . e n v . D B _ P A S S W O R D ,  
         d a t a b a s e :   p r o c e s s . e n v . D B _ N A M E ,  
 } ;  
  
 c o n s t   s q l   =   `  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   c a s h _ s e s s i o n s   (  
     i d   C H A R ( 2 6 )   P R I M A R Y   K E Y ,  
     t e n a n t _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     o p e n e d _ a t   T I M E S T A M P   N O T   N U L L   D E F A U L T   C U R R E N T _ T I M E S T A M P ,  
     c l o s e d _ a t   T I M E S T A M P   N U L L ,  
     o p e n i n g _ a m o u n t   D E C I M A L ( 1 2 , 2 )   N O T   N U L L   D E F A U L T   0 ,  
     c l o s i n g _ a m o u n t   D E C I M A L ( 1 2 , 2 )   N U L L ,  
     s t a t u s   E N U M ( ' O P E N ' , ' C L O S E D ' )   N O T   N U L L   D E F A U L T   ' O P E N ' ,  
     F O R E I G N   K E Y   ( t e n a n t _ i d )   R E F E R E N C E S   t e n a n t s ( i d )  
 )   E N G I N E = I n n o D B ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   f i x e d _ e x p e n s e s   (  
     i d   C H A R ( 2 6 )   P R I M A R Y   K E Y ,  
     t e n a n t _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     c a t e g o r y _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     n a m e   V A R C H A R ( 1 2 0 )   N O T   N U L L ,  
     a m o u n t   D E C I M A L ( 1 2 , 2 )   N O T   N U L L ,  
     d u e _ d a y   I N T   N O T   N U L L ,  
     a c t i v e   T I N Y I N T ( 1 )   N O T   N U L L   D E F A U L T   1 ,  
     F O R E I G N   K E Y   ( t e n a n t _ i d )   R E F E R E N C E S   t e n a n t s ( i d ) ,  
     F O R E I G N   K E Y   ( c a t e g o r y _ i d )   R E F E R E N C E S   c a s h _ c a t e g o r i e s ( i d )  
 )   E N G I N E = I n n o D B ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   m o n t h l y _ f i n a n c e _ r e a d   (  
     i d   C H A R ( 2 6 )   P R I M A R Y   K E Y ,  
     t e n a n t _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     m o n t h   V A R C H A R ( 7 )   N O T   N U L L ,   - -   Y Y Y Y - M M  
     i n c o m e _ t o t a l   D E C I M A L ( 1 2 , 2 )   N O T   N U L L   D E F A U L T   0 ,  
     e x p e n s e _ t o t a l   D E C I M A L ( 1 2 , 2 )   N O T   N U L L   D E F A U L T   0 ,  
     f i x e d _ t o t a l   D E C I M A L ( 1 2 , 2 )   N O T   N U L L   D E F A U L T   0 ,  
     v a r i a b l e _ t o t a l   D E C I M A L ( 1 2 , 2 )   N O T   N U L L   D E F A U L T   0 ,  
     r e s u l t _ t o t a l   D E C I M A L ( 1 2 , 2 )   N O T   N U L L   D E F A U L T   0 ,  
     u p d a t e d _ a t   T I M E S T A M P   N O T   N U L L   D E F A U L T   C U R R E N T _ T I M E S T A M P   O N   U P D A T E   C U R R E N T _ T I M E S T A M P ,  
     F O R E I G N   K E Y   ( t e n a n t _ i d )   R E F E R E N C E S   t e n a n t s ( i d ) ,  
     U N I Q U E   K E Y   u n i q _ m o n t h   ( t e n a n t _ i d ,   m o n t h )  
 )   E N G I N E = I n n o D B ;  
 ` ;  
  
 a s y n c   f u n c t i o n   m i g r a t e ( )   {  
         c o n s t   c o n n e c t i o n   =   a w a i t   m y s q l . c r e a t e C o n n e c t i o n ( d b C o n f i g ) ;  
         c o n s o l e . l o g ( ' R u n n i n g   m i g r a t i o n   S t e p   4 . . . ' ) ;  
         c o n s t   s t a t e m e n t s   =   s q l . s p l i t ( ' ; ' ) ;  
         f o r   ( c o n s t   s   o f   s t a t e m e n t s )   {  
                 i f   ( s . t r i m ( ) )   a w a i t   c o n n e c t i o n . q u e r y ( s ) ;  
         }  
         c o n s o l e . l o g ( ' M i g r a t i o n   S t e p   4   c o m p l e t e . ' ) ;  
         a w a i t   c o n n e c t i o n . e n d ( ) ;  
 }  
  
 m i g r a t e ( ) . c a t c h ( c o n s o l e . e r r o r ) ;  
 i m p o r t   ' d o t e n v / c o n f i g ' ;  
 i m p o r t   m y s q l   f r o m   ' m y s q l 2 / p r o m i s e ' ;  
  
 c o n s t   d b C o n f i g   =   {  
         h o s t :   p r o c e s s . e n v . D B _ H O S T ,  
         p o r t :   p r o c e s s . e n v . D B _ P O R T ,  
         u s e r :   p r o c e s s . e n v . D B _ U S E R ,  
         p a s s w o r d :   p r o c e s s . e n v . D B _ P A S S W O R D ,  
         d a t a b a s e :   p r o c e s s . e n v . D B _ N A M E ,  
 } ;  
  
 c o n s t   s q l   =   `  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   b r a n c h e s   (  
     i d   C H A R ( 2 6 )   P R I M A R Y   K E Y ,  
     t e n a n t _ i d   C H A R ( 2 6 )   N O T   N U L L ,  
     n a m e   V A R C H A R ( 1 0 0 )   N O T   N U L L ,  
     a d d r e s s   V A R C H A R ( 2 5 5 ) ,  
     p h o n e   V A R C H A R ( 5 0 ) ,  
     a c t i v e   T I N Y I N T ( 1 )   D E F A U L T   1 ,  
     c r e a t e d _ a t   T I M E S T A M P   D E F A U L T   C U R R E N T _ T I M E S T A M P ,  
     F O R E I G N   K E Y   ( t e n a n t _ i d )   R E F E R E N C E S   t e n a n t s ( i d )  
 )   E N G I N E = I n n o D B ;  
  
 A L T E R   T A B L E   o r d e r s   A D D   C O L U M N   b r a n c h _ i d   C H A R ( 2 6 )   N U L L ;  
 A L T E R   T A B L E   o r d e r s   A D D   C O N S T R A I N T   f k _ o r d e r s _ b r a n c h   F O R E I G N   K E Y   ( b r a n c h _ i d )   R E F E R E N C E S   b r a n c h e s ( i d ) ;  
  
 A L T E R   T A B L E   u s e r s   A D D   C O L U M N   b r a n c h _ i d   C H A R ( 2 6 )   N U L L ;  
 A L T E R   T A B L E   u s e r s   A D D   C O N S T R A I N T   f k _ u s e r s _ b r a n c h   F O R E I G N   K E Y   ( b r a n c h _ i d )   R E F E R E N C E S   b r a n c h e s ( i d ) ;  
 ` ;  
  
 a s y n c   f u n c t i o n   m i g r a t e ( )   {  
         c o n s t   c o n n e c t i o n   =   a w a i t   m y s q l . c r e a t e C o n n e c t i o n ( d b C o n f i g ) ;  
         c o n s o l e . l o g ( ' R u n n i n g   m i g r a t i o n   S t e p   5 . . . ' ) ;  
         c o n s t   s t a t e m e n t s   =   s q l . s p l i t ( ' ; ' ) ;  
         f o r   ( c o n s t   s   o f   s t a t e m e n t s )   {  
                 i f   ( s . t r i m ( ) )   {  
                         t r y   {  
                                 a w a i t   c o n n e c t i o n . q u e r y ( s ) ;  
                         }   c a t c h   ( e )   {  
                                 c o n s o l e . w a r n ( ' M i g r a t i o n   w a r n i n g   ( m i g h t   b e   d u p l i c a t e   c o l u m n ) : ' ,   e . m e s s a g e ) ;  
                         }  
                 }  
         }  
         c o n s o l e . l o g ( ' M i g r a t i o n   S t e p   5   c o m p l e t e . ' ) ;  
         a w a i t   c o n n e c t i o n . e n d ( ) ;  
 }  
  
 m i g r a t e ( ) . c a t c h ( c o n s o l e . e r r o r ) ;  
 