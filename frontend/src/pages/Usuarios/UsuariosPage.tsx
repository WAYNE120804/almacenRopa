import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';

type ScopeItem = {
  vendedorId: string | null;
  rifaVendedorId: string | null;
  vendedorNombre: string | null;
  rifaNombre: string | null;
};

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  scopes: {
    vendedorIds: string[];
    rifaVendedorIds: string[];
    items?: ScopeItem[];
  };
};

type Vendedor = {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
};

type VendedorDetalle = Vendedor & {
  usuarioScopes: Array<{
    id: string;
    usuario: {
      id: string;
      nombre: string;
      email: string;
      rol: string;
      activo: boolean;
    } | null;
    rifaVendedor: {
      id: string;
      rifaId: string;
    } | null;
  }>;
};

type Rifa = {
  id: string;
  nombre: string;
};

type RifaVendedor = {
  id: string;
  rifaId: string;
  vendedorId: string;
  vendedor?: {
    id: string;
    nombre: string;
  } | null;
  rifa?: {
    id: string;
    nombre: string;
  } | null;
};

const initialSpecialForm = {
  nombre: '',
  email: '',
  password: '',
  rifaVendedorIds: [] as string[],
};

const initialAccessForm = {
  nombre: '',
  email: '',
  password: '',
};

const isSpecialVendorName = (name?: string | null) => {
  const normalized = (name || '').trim().toUpperCase();
  return normalized === 'PAGINA WEB' || normalized.includes('BOT');
};

const getRelationLabel = (relation: RifaVendedor) =>
  `${relation.vendedor?.nombre || 'Sin vendedor'} · ${relation.rifa?.nombre || 'Sin rifa'}`;

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [rifaVendedores, setRifaVendedores] = useState<RifaVendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingSpecial, setSavingSpecial] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [preparingChannel, setPreparingChannel] = useState<'BOT' | 'WEB' | null>(null);
  const [specialForm, setSpecialForm] = useState(initialSpecialForm);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendedorDetalle | null>(null);
  const [accessForm, setAccessForm] = useState(initialAccessForm);
  const [selectedRifaId, setSelectedRifaId] = useState('');

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadAll = async () => {
    const [usuariosRes, vendedoresRes, rifasRes, relacionesRes] = await Promise.all([
      client.get(endpoints.usuarios()),
      client.get(endpoints.vendedores()),
      client.get(endpoints.rifas()),
      client.get(endpoints.rifaVendedores()),
    ]);

    setUsuarios(usuariosRes.data);
    setVendedores(vendedoresRes.data);
    setRifas(rifasRes.data);
    setRifaVendedores(relacionesRes.data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadAll();
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const specialRelations = useMemo(
    () => rifaVendedores.filter((item) => isSpecialVendorName(item.vendedor?.nombre)),
    [rifaVendedores]
  );

  const humanVendedores = useMemo(
    () => vendedores.filter((item) => !isSpecialVendorName(item.nombre)),
    [vendedores]
  );

  const filteredHumanVendedores = useMemo(() => {
    const term = vendorSearch.trim().toLowerCase();

    if (!term) {
      return humanVendedores;
    }

    return humanVendedores.filter((item) =>
      [item.nombre, item.documento, item.telefono, item.direccion]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [humanVendedores, vendorSearch]);

  const rifaOptions = useMemo(
    () => rifas.map((rifa) => ({ value: rifa.id, label: rifa.nombre })),
    [rifas]
  );

  const selectedVendorPrimaryUser = useMemo(() => {
    if (!selectedVendor) {
      return null;
    }

    return (
      selectedVendor.usuarioScopes.find(
        (scope) => scope.usuario?.id && !scope.rifaVendedor?.id
      )?.usuario ||
      selectedVendor.usuarioScopes.find((scope) => scope.usuario?.id)?.usuario ||
      null
    );
  }, [selectedVendor]);

  const openVendorAccess = async (vendorId: string) => {
    try {
      resetMessages();
      const { data } = await client.get(endpoints.vendedorById(vendorId));
      setSelectedVendor(data);

      const currentUser =
        data.usuarioScopes.find((scope: any) => scope.usuario?.id && !scope.rifaVendedor?.id)
          ?.usuario ||
        data.usuarioScopes.find((scope: any) => scope.usuario?.id)?.usuario ||
        null;

      setAccessForm({
        nombre: currentUser?.nombre || data.nombre || '',
        email: currentUser?.email || data.documento || '',
        password: '',
      });
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const closeVendorAccess = () => {
    setSelectedVendor(null);
    setAccessForm(initialAccessForm);
  };

  const handleSaveVendorAccess = async () => {
    if (!selectedVendor) {
      return;
    }

    setSavingAccess(true);
    resetMessages();

    try {
      await client.put(endpoints.vendedorAcceso(selectedVendor.id), accessForm);
      await loadAll();
      setSuccess(
        selectedVendorPrimaryUser
          ? 'Credenciales del vendedor actualizadas correctamente.'
          : 'Acceso del vendedor creado correctamente.'
      );
      closeVendorAccess();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingAccess(false);
    }
  };

  const toggleSpecialRelation = (relationId: string) => {
    setSpecialForm((current) => ({
      ...current,
      rifaVendedorIds: current.rifaVendedorIds.includes(relationId)
        ? current.rifaVendedorIds.filter((id) => id !== relationId)
        : [...current.rifaVendedorIds, relationId],
    }));
  };

  const handleCreateSpecialUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSpecial(true);
    resetMessages();

    try {
      await client.post(endpoints.usuarios(), {
        nombre: specialForm.nombre,
        email: specialForm.email,
        password: specialForm.password,
        rol: 'VENDEDOR',
        vendedorIds: [],
        rifaVendedorIds: specialForm.rifaVendedorIds,
      });
      setSpecialForm(initialSpecialForm);
      await loadAll();
      setSuccess('Usuario supervisor creado correctamente para el canal especial.');
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingSpecial(false);
    }
  };

  const handlePrepareChannel = async (channel: 'BOT' | 'WEB') => {
    if (!selectedRifaId) {
      setError('Selecciona una rifa para preparar el canal especial.');
      return;
    }

    setPreparingChannel(channel);
    resetMessages();

    try {
      await client.post(
        channel === 'BOT' ? endpoints.prepararCanalBot() : endpoints.prepararCanalWeb(),
        { rifaId: selectedRifaId }
      );
      await loadAll();
      setSuccess(
        channel === 'BOT'
          ? 'Canal BOT preparado correctamente para la rifa.'
          : 'Canal PAGINA WEB preparado correctamente para la rifa.'
      );
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setPreparingChannel(null);
    }
  };

  const handleToggleUser = async (usuario: Usuario) => {
    resetMessages();

    try {
      await client.patch(endpoints.usuarioActivo(usuario.id), {
        activo: !usuario.activo,
      });
      await loadAll();
      setSuccess(
        usuario.activo
          ? 'Usuario desactivado correctamente.'
          : 'Usuario activado correctamente.'
      );
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  return (
    <div>
      <Topbar title="Usuarios" />

      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {loading ? <Loading label="Cargando administracion de usuarios..." /> : null}

        {!loading ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Acceso de vendedores humanos
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Busca el vendedor existente, revisa si ya tiene usuario y crea o cambia sus credenciales.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm">
                  <span className="text-slate-600">Buscar vendedor</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={vendorSearch}
                    onChange={(event) => setVendorSearch(event.target.value)}
                    placeholder="Nombre, documento, telefono o direccion"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {filteredHumanVendedores.map((vendedor) => {
                  const linkedUsers = usuarios.filter((usuario) =>
                    usuario.scopes.vendedorIds.includes(vendedor.id)
                  );

                  return (
                    <article
                      key={vendedor.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">{vendedor.nombre}</h4>
                          <p className="mt-2 text-sm text-slate-600">
                            Documento: {vendedor.documento || 'Sin documento'}
                          </p>
                          <p className="text-sm text-slate-600">
                            Telefono: {vendedor.telefono || 'Sin telefono'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            linkedUsers.length
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {linkedUsers.length ? 'Con acceso' : 'Sin acceso'}
                        </span>
                      </div>

                      {linkedUsers.length ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          Usuario actual: <span className="font-semibold text-slate-900">{linkedUsers[0].email}</span>
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => void openVendorAccess(vendedor.id)}
                          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          {linkedUsers.length ? 'Cambiar credenciales' : 'Crear acceso'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Canales especiales: BOT y PAGINA WEB
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Primero prepara el canal especial dentro de una rifa. Luego crea aqui el usuario supervisor y amarralo a ese canal.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Preparar canal por rifa</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="min-w-[18rem] flex-1">
                    <SearchableSelect
                      options={rifaOptions}
                      value={selectedRifaId}
                      onChange={setSelectedRifaId}
                      placeholder="Selecciona una rifa"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handlePrepareChannel('BOT')}
                    disabled={preparingChannel !== null}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    {preparingChannel === 'BOT' ? 'Preparando BOT...' : 'Preparar BOT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePrepareChannel('WEB')}
                    disabled={preparingChannel !== null}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    {preparingChannel === 'WEB' ? 'Preparando WEB...' : 'Preparar PAGINA WEB'}
                  </button>
                </div>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateSpecialUser}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Nombre del usuario</span>
                  <input
                    value={specialForm.nombre}
                    onChange={(event) =>
                      setSpecialForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Documento o correo</span>
                  <input
                    value={specialForm.email}
                    onChange={(event) =>
                      setSpecialForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Contrasena</span>
                  <input
                    value={specialForm.password}
                    onChange={(event) =>
                      setSpecialForm((current) => ({ ...current, password: event.target.value }))
                    }
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </label>

                <div className="md:col-span-2">
                  <p className="mb-3 text-sm font-medium text-slate-700">Canales a supervisar</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {specialRelations.map((relation) => (
                      <label
                        key={relation.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                          checked={specialForm.rifaVendedorIds.includes(relation.id)}
                          onChange={() => toggleSpecialRelation(relation.id)}
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {relation.vendedor?.nombre || 'Canal especial'}
                          </span>
                          <span className="block text-slate-500">
                            {relation.rifa?.nombre || 'Sin rifa'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingSpecial}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingSpecial ? 'Guardando...' : 'Crear usuario especial'}
                  </button>
                </div>
              </form>
            </section>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Usuarios registrados
              </h3>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse">
                  <thead className="theme-table-head">
                    <tr className="text-left text-sm">
                      <th className="px-4 py-3 font-semibold">NOMBRE</th>
                      <th className="px-4 py-3 font-semibold">IDENTIFICADOR</th>
                      <th className="px-4 py-3 font-semibold">ROL</th>
                      <th className="px-4 py-3 font-semibold">ALCANCE</th>
                      <th className="px-4 py-3 font-semibold">ESTADO</th>
                      <th className="px-4 py-3 font-semibold">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-t border-slate-200 text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-900">{usuario.nombre}</td>
                        <td className="px-4 py-3 text-slate-700">{usuario.email}</td>
                        <td className="px-4 py-3 text-slate-700">{usuario.rol}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {usuario.scopes.items?.length ? (
                            <div className="space-y-1">
                              {usuario.scopes.items.slice(0, 3).map((item, index) => (
                                <div key={`${usuario.id}-${item.rifaVendedorId || item.vendedorId || index}`}>
                                  {item.vendedorNombre || 'Sin vendedor'}
                                  {item.rifaNombre ? ` · ${item.rifaNombre}` : ''}
                                </div>
                              ))}
                              {usuario.scopes.items.length > 3 ? (
                                <div className="text-xs text-slate-500">
                                  +{usuario.scopes.items.length - 3} scopes mas
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            'Sin scope'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              usuario.activo
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {usuario.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleUser(usuario)}
                            className="text-sm font-semibold text-slate-700 underline"
                          >
                            {usuario.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {selectedVendor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {selectedVendorPrimaryUser ? 'Cambiar credenciales' : 'Crear acceso'} de {selectedVendor.nombre}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Este usuario quedara amarrado al vendedor y vera todas sus relaciones de forma restringida.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={closeVendorAccess}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nombre del usuario</span>
                <input
                  value={accessForm.nombre}
                  onChange={(event) =>
                    setAccessForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Documento o correo</span>
                <input
                  value={accessForm.email}
                  onChange={(event) =>
                    setAccessForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Contrasena nueva</span>
                <input
                  value={accessForm.password}
                  onChange={(event) =>
                    setAccessForm((current) => ({ ...current, password: event.target.value }))
                  }
                  type="password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>Documento del vendedor: {selectedVendor.documento || 'Sin documento'}</p>
              <p className="mt-1">Telefono del vendedor: {selectedVendor.telefono || 'Sin telefono'}</p>
              {selectedVendorPrimaryUser ? (
                <p className="mt-1">
                  Usuario actual: <span className="font-semibold text-slate-900">{selectedVendorPrimaryUser.email}</span>
                </p>
              ) : (
                <p className="mt-1">Este vendedor todavia no tiene usuario creado.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={closeVendorAccess}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingAccess}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                onClick={() => void handleSaveVendorAccess()}
              >
                {savingAccess ? 'Guardando...' : selectedVendorPrimaryUser ? 'Cambiar credenciales' : 'Crear acceso'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsuariosPage;
