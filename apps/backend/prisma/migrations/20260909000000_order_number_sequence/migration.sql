-- Secuencia para el codigo publico de orden (S02415, S02416, ...).
--
-- Se usa una secuencia de PostgreSQL y no un contador calculado con COUNT(*)
-- porque la secuencia es atomica bajo concurrencia: dos compras simultaneas
-- nunca reciben el mismo numero, ni siquiera dentro de la misma transaccion.
-- Ademas no retrocede si una orden se elimina.
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  AS BIGINT
  START WITH 2415
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;
